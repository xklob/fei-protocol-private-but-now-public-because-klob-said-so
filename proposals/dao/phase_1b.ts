import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Tribal Council action to clawback the Rari Infrastructure timelocks

*/

const fipNumber = 'Phase 1b: Rari Infrastructure clawback';

// Clawed back FEI upper bound
const CLAWED_BACK_FEI_UPPER_BOUND = '2897332829955035696312531';

// Clawed back TRIBE upper bound
const CLAWED_BACK_TRIBE_UPPER_BOUND = '3068505367127310595321005';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
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
  // 1. Validate Rari Infra timelocks no longer have funds
  expect(await contracts.fei.balanceOf(addresses.newRariInfraFeiTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.newRariInfraTribeTimelock)).to.be.equal(0);

  // 2. Validate TC burned existing FEI
  // TODO

  // 3. Validate FEI and TRIBE approvals given to DAO timelock
  expect(await contracts.fei.allowance(addresses.tribalCouncilTimelock, addresses.feiDAOTimelock)).to.be.equal(
    CLAWED_BACK_FEI_UPPER_BOUND
  );
  expect(await contracts.tribe.allowance(addresses.tribalCouncilTimelock, addresses.feiDAOTimelock)).to.be.equal(
    CLAWED_BACK_TRIBE_UPPER_BOUND
  );
};

export { deploy, setup, teardown, validate };
