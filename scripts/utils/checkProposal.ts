import { getAllContracts, getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { getImpersonatedSigner, time } from '@test/helpers';
import { NamedContracts, UpgradeFuncs } from '@custom-types/types';

import * as dotenv from 'dotenv';
import { forceEth } from '@test/integration/setup/utils';

dotenv.config();

// Multisig
const feiVoterAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';

// Fuse Pool
const rariVoterAddress = '0x7d7ec1c9b40f8d4125d2ee524e16b65b3ee83e8f';

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function checkProposal() {
  const proposalName = 'merger';
  const feiProposalNo = '100913008905461844936601668456794711523658459114127771687920359665569753117360';
  const rariProposalNo = '9';

  if (!proposalName || !feiProposalNo) {
    throw new Error('DEPLOY_FILE or PROPOSAL_NUMBER env variable not set');
  }

  await forceEth(rariVoterAddress);

  // Get the upgrade setup, run and teardown scripts
  const proposalFuncs: UpgradeFuncs = await import(`@proposals/dao/${proposalName}`);

  const contracts = (await getAllContracts()) as unknown as NamedContracts;

  const contractAddresses = getAllContractAddresses();

  if (process.env.DO_SETUP) {
    console.log('Setup');
    await proposalFuncs.setup(
      contractAddresses,
      contracts as unknown as NamedContracts,
      contracts as unknown as NamedContracts,
      true
    );
  }

  const { feiDAO, rariDAO } = contracts;

  const feiVoterSigner = await getImpersonatedSigner(feiVoterAddress);
  const rariVoterSigner = await getImpersonatedSigner(rariVoterAddress);

  console.log(`Proposal Number: ${feiProposalNo}`);

  const feiProposal = await feiDAO.proposals(feiProposalNo);
  const rariProposal = await rariDAO.proposals(rariProposalNo);
  const { startBlock } = feiProposal;

  // Advance to vote start
  if ((await time.latestBlock()) < startBlock) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(Number(startBlock.toString()));
  } else {
    console.log('Vote already began');
  }

  console.log('Casting rari vote.');
  await rariDAO.connect(rariVoterSigner).castVote(rariProposalNo, 1);

  try {
    await feiDAO.connect(feiVoterSigner).castVote(feiProposalNo, 1);
    console.log('Casted fei vote.');
  } catch {
    console.log('Already voted, or some terrible error has occured.');
  }

  const feiEndBlock = Number(feiProposal.endBlock);
  const rariEndBlock = Number(rariProposal.endBlock);

  const endBlock = Math.max(feiEndBlock, rariEndBlock);

  // Advance to after vote completes and queue the transaction
  if ((await time.latestBlock()) < endBlock) {
    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(Number(endBlock.toString()));

    console.log('Queuing');

    await rariDAO['queue(uint256)'](rariProposalNo);
    await feiDAO['queue(uint256)'](feiProposalNo);
  } else {
    console.log('Already queued');
  }

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(172800); // 2 days in seconds

  console.log('Executing Rari Proposal');
  try {
    await rariDAO['execute(uint256)'](rariProposalNo);
  } catch {
    console.log('Already executed, or some terrible error has occured.');
  }
  console.log('Rari Success');

  console.log('Executing Fei Proposal');
  try {
    await feiDAO['execute(uint256)'](feiProposalNo);
  } catch {
    console.log('Already executed, or some terrible error has occured.');
  }
  console.log('Rari Success');

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
}

checkProposal()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
