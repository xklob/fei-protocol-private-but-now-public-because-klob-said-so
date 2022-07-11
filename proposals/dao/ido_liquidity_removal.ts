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

// Approximate bounds on the FEI to be transferred to the new timelock after LP tokens redeemed
const LOWER_BOUND_FEI = ethers.constants.WeiPerEther.mul(37_000_000);
const UPPER_BOUND_FEI = ethers.constants.WeiPerEther.mul(50_000_000);

// Expected bounds on the TRIBE to be transferred to the new timelock after LP tokens redeemed
const LOWER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(250_000_000);
const UPPER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(350_000_000);

// Maxmimum slippage permitted on the liquidity extraction
const MAX_SLIPPAGE_BASIS_POINTS = 200;

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

  // 3. Deploy IDO Liquidity Withdrawal helper contract
  const IDOLiquidityRemovalFactory = await ethers.getContractFactory('IDOLiquidityRemover');
  const idoLiquidityRemover = await IDOLiquidityRemovalFactory.deploy(
    addresses.core,
    feiIDOTimelock.address,
    tribeIDOTimelock.address,
    addresses.uniswapRouter,
    addresses.feiTribePair,
    MAX_SLIPPAGE_BASIS_POINTS
  );
  await idoLiquidityRemover.deployTransaction.wait();
  console.log('IDO liquidity remover deployed to: ', idoLiquidityRemover.address);

  return {
    feiIDOTimelock,
    tribeIDOTimelock,
    idoLiquidityRemover
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
  expect(await contracts.tribeIDOTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.tribeIDOTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await contracts.tribeIDOTimelock.lockedToken()).to.be.equal(addresses.tribe);
  // expect(await contracts.tribeDOTimelock.duration()).to.be.equal();
  expect(await contracts.tribeIDOTimelock.cliffSeconds()).to.be.equal(0);

  // 3. Validate IDO liquidity remover configured
  expect(await contracts.idoLiquidityRemover.feiTo()).to.be.equal(addresses.feiIDOTimelock);
  expect(await contracts.idoLiquidityRemover.tribeTo()).to.be.equal(addresses.tribeIDOTimelock);
  expect(await contracts.idoLiquidityRemover.uniswapRouter()).to.be.equal(addresses.uniswapRouter);
  expect(await contracts.idoLiquidityRemover.pair()).to.be.equal(addresses.feiTribePair);
  expect(await contracts.idoLiquidityRemover.maxBasisPointsFromPegLP()).to.be.equal(MAX_SLIPPAGE_BASIS_POINTS);

  // 4. IDO LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);

  // 5. New IDO FEI and TRIBE timelocks should have FEI and TRIBE
  // Fei-Tribe LP worth ~$85M
  // Constant product AMM, so equal worth of FEI and TRIBE
  // $42.5M FEI, $42.5M TRIBE
  // 1 FEI = $1, 1 TRIBE ~= $0.15
  // Expect, ~42.5M FEI, ~280M TRIBE
  const feiTimelockBalance = await contracts.fei.balanceOf(addresses.feiIDOTimelock);
  expect(feiTimelockBalance).to.be.bignumber.greaterThan(LOWER_BOUND_FEI);
  expect(feiTimelockBalance).to.be.bignumber.lessThan(UPPER_BOUND_FEI);

  const tribeTimelockBalance = await contracts.tribe.balanceOf(addresses.tribeIDOTimelock);
  expect(tribeTimelockBalance).to.be.bignumber.greaterThan(LOWER_BOUND_TRIBE);
  expect(tribeTimelockBalance).to.be.bignumber.lessThan(UPPER_BOUND_TRIBE);

  // Stable backing currently 93%. To get to 100%, need 8.3M
  // Burn 10M FEI
  // Send remainder to the Fei timelock

  // TODO: Calculate how much additional TRIBE is going to the Fei Labs vesting contracts

  // 6. Beneficiary should be able to claim from Fei timelock

  // 7. Beneficiary should be able to claim from Tribe timelock
};

export { deploy, setup, teardown, validate };
