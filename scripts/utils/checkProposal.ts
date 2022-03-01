import { getAllContracts, getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { NamedContracts, UpgradeFuncs } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';

import * as dotenv from 'dotenv';
import { execProposal } from './exec';
import { overwriteChainlinkAggregator } from '@test/helpers';

dotenv.config();

// Multisig
const voterAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';
const proposalName = process.env.DEPLOY_FILE;
const doSetup = process.env.DO_SETUP;
const checkCrOracle = process.env.READ_CR_ORACLE;

if (!proposalName) {
  throw new Error('DEPLOY_FILE env variable not set');
}

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function checkProposal(proposalName: string, doSetup?: string) {
  // Get the upgrade setup, run and teardown scripts
  const proposalFuncs: UpgradeFuncs = await import(`@proposals/dao/${proposalName}`);

  const contracts = (await getAllContracts()) as unknown as NamedContracts;

  const contractAddresses = getAllContractAddresses();

  if (proposalFuncs.setup.toString().length > 130 && !doSetup) {
    console.log(
      '\x1b[33mHeads up: setup() is defined in ' +
        proposalName +
        ', but you did not use the DO_SETUP=true env variable\x1b[0m'
    );
  }

  if (doSetup) {
    console.log('Setup');
    await proposalFuncs.setup(
      contractAddresses,
      contracts as unknown as NamedContracts,
      contracts as unknown as NamedContracts,
      true
    );
  }

  let crOracleReadingBefore;
  if (checkCrOracle) {
    console.log('Reading CR oracle before proposal execution');
    crOracleReadingBefore = await contracts.collateralizationOracle.pcvStats();

    // persist chainlink ETH/USD reading for BAMM deposit to not revert with 'chainlink is down'
    const chainlinkEthUsd = await contracts.chainlinkEthUsdOracleWrapper.read();
    await overwriteChainlinkAggregator(
      contractAddresses.chainlinkEthUsdOracle,
      Math.round(chainlinkEthUsd[0] / 1e10),
      '8'
    );
  }

  const { feiDAO } = contracts;

  const proposalNo = proposals[proposalName].proposalId;

  await execProposal(voterAddress, feiDAO.address, proposals[proposalName].totalValue, proposalNo);

  console.log('Teardown');
  await proposalFuncs.teardown(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );

  console.log('Validate');
  await proposalFuncs.validate(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );

  if (checkCrOracle) {
    console.log('Reading CR oracle after proposal execution');
    const crOracleReadingAfter = await contracts.collateralizationOracle.pcvStats();
    const pcvChange =
      crOracleReadingAfter.protocolControlledValue.toString() / 1 -
      crOracleReadingBefore.protocolControlledValue.toString() / 1;
    const feiChange =
      crOracleReadingAfter.userCirculatingFei.toString() / 1 - crOracleReadingBefore.userCirculatingFei.toString() / 1;
    console.log('\x1b[33mPCV Change\x1b[0m :', formatNumber(pcvChange));
    console.log('\x1b[33mFEI Circulating Change\x1b[0m :', formatNumber(feiChange));
  }
}

checkProposal(proposalName, doSetup)
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

function formatNumber(x) {
  x = Number(x);
  let ret = x >= 0 ? '\x1b[32m+' : '\x1b[31m-'; // red or green
  let absX = Math.abs(x);
  let suffix = '';
  if (absX >= 1e17) {
    // 18 decimals... probably
    absX = absX / 1e18;
    suffix = ' (e18)';
  }
  if (absX > 1e6) {
    // > 1M
    absX = absX / 1e6;
    suffix = ' M' + suffix;
  } else if (absX > 1e3) {
    // > 1k
    absX = absX / 1e3;
    suffix = ' k' + suffix;
  }
  const xRound = Math.round(absX * 100) / 100;
  ret += xRound + suffix;
  ret += '\x1b[0m'; // end color
  return ret;
}
