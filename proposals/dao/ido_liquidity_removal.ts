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
import { BigNumber } from 'ethers';

/*

IDO liquidity removal

1. Clawback Rari Infra team timelocks
2. Clawback La Tribu timelocks
3. Accept beneficiary of vesting FEI and TRIBE contracts
4. Transfer ownership of the IDO liquidity
5. Early unlock the IDO liquidity, burn the FEI and send the TRIBE to the Treasury

*/

const fipNumber = 'ido_liquidity_removal';

// Approximate bounds on the FEI to be transferred to the new timelock after LP tokens redeemed
const LOWER_BOUND_FEI = ethers.constants.WeiPerEther.mul(27_000_000);
const UPPER_BOUND_FEI = ethers.constants.WeiPerEther.mul(40_000_000);

// FEI liquidity sent to the DAO timelock upon redemption and burned
const FEI_BURNED = ethers.constants.WeiPerEther.mul(10_000_000);

// Additional TRIBE being sent to new timelock, to compensate for FEI burning
const TRIBE_PRICE = 15; // TRIBE price in USD. TODO: Get Storm's help to verify this
const TRIBE_COMPENSATION = FEI_BURNED.mul(TRIBE_PRICE).div(100); // 67M TRIBE, Tribe price = $0.15

// Expected bounds on the TRIBE to be transferred to the new timelock after LP tokens redeemed
// Bounds calculated from the approximate amount of TRIBE expected to be unlocked + the additional
// TRIBE that is being allocated to compensate the FEI burn
const LOWER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(250_000_000).add(TRIBE_COMPENSATION);
const UPPER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(350_000_000).add(TRIBE_COMPENSATION);

// Fei Labs multisig controlling the Fei Labs treasury
const feiLabsTreasuryMultisig = '0x3A24fea1509e1BaeB2D2A7C819A191AA441825ea';

let initialFeiTotalSupply: BigNumber;
let initialTribeTreasuryBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const idoLiquidityTimelock = await ethers.getContractAt('LinearTokenTimelock', addresses.idoLiquidityTimelock);
  const idoTimelockRemainingDuration = await idoLiquidityTimelock.remainingTime();
  console.log('Remaining time: ', idoTimelockRemainingDuration.toString());

  // Deploy IDO Liquidity Withdrawal helper contract
  const IDOLiquidityRemovalFactory = await ethers.getContractFactory('IDOLiquidityRemover');
  const idoLiquidityRemover = await IDOLiquidityRemovalFactory.deploy(addresses.core);
  await idoLiquidityRemover.deployTransaction.wait();
  console.log('IDO liquidity remover deployed to: ', idoLiquidityRemover.address);

  return {
    idoLiquidityRemover
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Set pending beneficiary to the DAO timelock
  const feiLabsTreasurySigner = await getImpersonatedSigner(feiLabsTreasuryMultisig);
  await contracts.idoLiquidityTimelock.connect(feiLabsTreasurySigner).setPendingBeneficiary(addresses.feiDAOTimelock);

  // TODO: Set pending beneficiary appropriately for the vesting FEI/TRIBE timelocks

  initialFeiTotalSupply = await contracts.fei.totalSupply();
  initialTribeTreasuryBalance = await contracts.tribe.balanceOf(addresses.core);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate Rari Infra clawed back
  expect(await contracts.fei.balanceOf(addresses.newRariInfraFeiTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.newRariInfraTribeTimelock)).to.be.equal(0);

  // 2. Validate La Tribu clawed back
  expect(await contracts.fei.balanceOf(addresses.laTribuFeiTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.laTribuTribeTimelock)).to.be.equal(0);

  // 1. Validate IDO liquidity remover configured
  expect(await contracts.idoLiquidityRemover.UNISWAP_ROUTER()).to.be.equal(addresses.uniswapRouter);
  expect(await contracts.idoLiquidityRemover.FEI_TRIBE_PAIR()).to.be.equal(addresses.feiTribePair);

  // 2. IDO LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);

  // 5. IDO FEI should have been burned, TRIBE should have been sent to Treasury
  // Fei-Tribe LP worth ~$85M
  // Constant product AMM, so equal worth of FEI and TRIBE
  // $42.5M FEI, $42.5M TRIBE
  // 1 FEI = $1, 1 TRIBE ~= $0.15
  // 10M FEI sent to DAO timelock for burning
  // Expect, ~32.5M FEI, ~280M TRIBE
  const feiBurned = initialFeiTotalSupply.sub(await contracts.fei.totalSupply());
  expect(feiBurned).to.be.bignumber.greaterThan(LOWER_BOUND_FEI);
  expect(feiBurned).to.be.bignumber.lessThan(UPPER_BOUND_FEI);

  // Validate TRIBE sent to Treasury
  const tribeRedeemed = (await contracts.tribe.balanceOf(addresses.core)).sub(initialTribeTreasuryBalance);
  expect(tribeRedeemed).to.be.bignumber.greaterThan(LOWER_BOUND_TRIBE);
  expect(tribeRedeemed).to.be.bignumber.lessThan(UPPER_BOUND_TRIBE);
};

export { deploy, setup, teardown, validate };
