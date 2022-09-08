import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';

/*

DAO Proposal #9001

*/

// Minimum expected to be clawed back from La Tribu
const MIN_LA_TRIBUE_FEI = ethers.constants.WeiPerEther.mul(100_000);
const MIN_LA_TRIBUE_TRIBE = ethers.constants.WeiPerEther.mul(100_000);

let initialDAOFeiBalance: BigNumber;
let initialDAOTribeBalance: BigNumber;

const fipNumber = '9001'; // Change me!

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
  initialDAOFeiBalance = await contracts.fei.balanceOf(addresses.feiDAOTimelock);
  initialDAOTribeBalance = await contracts.tribe.balanceOf(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 6. Clawback of La Tribu FEI and TRIBE timelocks worked
  // Verify no funds on timelocks
  expect(await contracts.fei.balanceOf(addresses.laTribuFeiTimelock)).to.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.laTribuTribeTimelock)).to.equal(0);

  // Verify DAO timelock received FEI and TRIBE
  const daoFeiGain = (await contracts.fei.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOFeiBalance);
  expect(daoFeiGain).to.be.bignumber.greaterThan(MIN_LA_TRIBUE_FEI);

  const daoTribeGain = (await contracts.tribe.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOTribeBalance);
  expect(daoTribeGain).to.be.bignumber.greaterThan(MIN_LA_TRIBUE_TRIBE);
};

export { deploy, setup, teardown, validate };
