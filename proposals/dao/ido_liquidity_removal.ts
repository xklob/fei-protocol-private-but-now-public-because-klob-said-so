import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';

/*

IDO liquidity removal

1. Transfer ownership of the IDO liquidity to the DAO timelock
2. Early unlock the IDO liquidity and split liquidity
3. Convert an amount of FEI into TRIBE
4. Lock remaining in new timelocks

*/

const fipNumber = 'ido_liquidity_removal';

// TODO
// Expected amount of FEI to be transferred to the new timelock after LP tokens redeemed
const NEW_FEI_TIMELOCK_AMOUNT = ethers.constants.WeiPerEther.mul(100_000);

// Expected amount of TRIBE to be transferred to the new timelock after LP tokens redeemed
const NEW_TRIBE_TIMELOCK_AMOUNT = ethers.constants.WeiPerEther.mul(100_000);

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const idoLiquidityTimelock = await ethers.getContractAt('LinearTokenTimelock', addresses.idoLiquidityTimelock);
  const idoTimelockRemainingDuration = await idoLiquidityTimelock.remainingTime();
  console.log('Remaining time: ', idoTimelockRemainingDuration.toString());

  // 1. Deploy new FEI linear token timelock - Fei timelock, no vote delegation
  const LinearTokenTimelockedFactory = await ethers.getContractFactory('LinearTokenTimelock');
  const feiIDOTimelock = await LinearTokenTimelockedFactory.deploy(
    addresses.feiDAOTimelock, // beneficiary
    idoTimelockRemainingDuration, // duration
    addresses.fei, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await feiIDOTimelock.deployTransaction.wait();

  logging && console.log('New FEI timelock deployed to: ', feiIDOTimelock.address);

  // 2. Deploy new TRIBE linear token delegator timelock
  const LinearTokenTimelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator');
  const tribeIDOTimelock = await LinearTokenTimelockedDelegatorFactory.deploy(
    addresses.feiDAOTimelock, // beneficiary
    idoTimelockRemainingDuration, // duration
    addresses.tribe, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await tribeIDOTimelock.deployTransaction.wait();
  logging && console.log('New TRIBE delegator timelock deployed to: ', tribeIDOTimelock.address);

  return {
    feiIDOTimelock,
    tribeIDOTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Set pending beneficiary to the DAO timelock
  const beneficiary = '0x3A24fea1509e1BaeB2D2A7C819A191AA441825ea';
  const beneficiarySigner = await getImpersonatedSigner(beneficiary);
  await contracts.idoLiquidityTimelock.connect(beneficiarySigner).setPendingBeneficiary(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // TODO: Validate duration on these timelocks
  // 1. Validate FEI timelock configured
  expect(await contracts.feiIDOTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.feiIDOTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.feiIDOTimelock.lockedToken()).to.be.equal(addresses.fei);
  // expect(await contracts.feiIDOTimelock.duration()).to.be.equal();
  expect(await contracts.feiIDOTimelock.cliffSeconds()).to.be.equal(0);

  // 2. Validate TRIBE timelock configured
  expect(await contracts.tribeDOTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.tribeDOTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.tribeDOTimelock.lockedToken()).to.be.equal(addresses.tribe);
  // expect(await contracts.tribeDOTimelock.duration()).to.be.equal();
  expect(await contracts.tribeDOTimelock.cliffSeconds()).to.be.equal(0);

  // 3. IDO LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);

  // 4. New IDO FEI and TRIBE timelocks should have FEI and TRIBE
  expect(await contracts.fei.balanceOf(addresses.feiIDOTimelock)).to.be.bignumber.greaterThan(NEW_FEI_TIMELOCK_AMOUNT);
  expect(await contracts.tribe.balanceOf(addresses.tribeIDOTimelock)).to.be.bignumber.greaterThan(
    NEW_TRIBE_TIMELOCK_AMOUNT
  );
};

export { deploy, setup, teardown, validate };
