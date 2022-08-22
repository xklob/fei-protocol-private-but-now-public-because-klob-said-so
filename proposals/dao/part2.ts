import { RariMerkleRedeemer__factory } from '@custom-types/contracts/factories/RariMerkleRedeemer__factory';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { cTokens } from '@proposals/data/hack_repayment/cTokens';
import { rates } from '@proposals/data/hack_repayment/rates';
import { roots } from '@proposals/data/hack_repayment/roots';
import { MainnetContractsConfig } from '@protocol/mainnetAddresses';
import { ethers } from 'hardhat';

/*

DAO Proposal Part 2

Description: Enable and mint FEI into the RariMerkleRedeeemr contract, allowing those that are specified 
in the snapshot [insert link] and previous announcement to redeem an amount of cTokens for FEI.

Steps:
  1 - Mint FEI to the RariMerkleRedeemer contract
*/

const fipNumber = 'part2';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // @todo deploy RariMerkleRedeemer
  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory((await ethers.getSigners())[0]);
  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address, // token: fei
    cTokens, // ctokens (address[])
    rates, // rates (uint256[])
    roots // roots (bytes32[])
  );

  return {
    rariMerkleRedeemer
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // @todo add some quick validations that people could redeem (not extensive, that'll be in the tests)
};

export { deploy, setup, teardown, validate };
