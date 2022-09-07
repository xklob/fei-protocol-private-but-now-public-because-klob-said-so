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

TIP_121c: Deprecate Tribe DAO and Fei sub-systems

*/

const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

const fipNumber = 'TIP_121c: Deprecate Tribe DAO and Fei sub-systems';

// Minimum expected to be clawed back from La Tribu
const MIN_LA_TRIBUE_FEI = ethers.constants.WeiPerEther.mul(100_000);
const MIN_LA_TRIBUE_TRIBE = ethers.constants.WeiPerEther.mul(100_000);

let initialDAOFeiBalance: BigNumber;
let initialDAOTribeBalance: BigNumber;

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
  // 0. No check for revoked Tribe roles - there is a seperate e2e

  // 1. Verify init impossible to call on core
  await expect(contracts.core.init()).to.be.revertedWith('Initializable: contract is already initialized');

  // 2. Verify Tribe minter set to zero address and inflation is the minimum of 0.01% (1 basis point)
  expect(await contracts.tribe.minter()).to.equal(ethers.constants.AddressZero);
  expect(await contracts.tribeMinter.annualMaxInflationBasisPoints()).to.equal(1);

  // 3. Verify PCV Sentinel has all guards removed
  expect((await contracts.pcvSentinel.allGuards()).length).to.equal(0);

  // 4. Verify Tribe Reserve Stabiliser is paused
  expect(await contracts.tribeReserveStabilizer.paused()).to.be.true;

  // 5. Verify ProxyAdmin is deprecated
  expect(await contracts.proxyAdmin.owner()).to.equal(ADDRESS_ONE);

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
