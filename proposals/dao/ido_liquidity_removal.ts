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
import { abi as timelockABI } from '../../artifacts/contracts/timelocks/TimelockedDelegator.sol/TimelockedDelegator.json';

/*

Phase 1: Remove vesting FEI and TRIBE, remove Uniswap liquidity

1. Clawback La Tribu timelocks
2. Accept beneficiary of vesting FEI and TRIBE contracts
3. Transfer ownership of the IDO liquidity
4. Early unlock the IDO liquidity, burn the FEI and send the TRIBE to the Treasury

*/

const fipNumber = 'ido_liquidity_removal';

// Approximate bounds on the FEI to be burned after LP tokens redeemed
const LOWER_BOUND_FEI = ethers.constants.WeiPerEther.mul(30_000_000);
const UPPER_BOUND_FEI = ethers.constants.WeiPerEther.mul(50_000_000);

// Expected bounds on the TRIBE to be transferred to the Core Treasury after LP tokens redeemed
const LOWER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(250_000_000);
const UPPER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(350_000_000);

let initialFeiTotalSupply: BigNumber;
let initialTribeTreasuryBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy IDO Liquidity Remover helper contract
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
  initialFeiTotalSupply = await contracts.fei.totalSupply();
  initialTribeTreasuryBalance = await contracts.tribe.balanceOf(addresses.core);

  // 1. Set pending beneficiary of IDO liquidity timelock to the DAO timelock
  const feiLabsTreasuryMultisig = '0x3A24fea1509e1BaeB2D2A7C819A191AA441825ea';
  const feiLabsTreasurySigner = await getImpersonatedSigner(feiLabsTreasuryMultisig);
  await contracts.idoLiquidityTimelock.connect(feiLabsTreasurySigner).setPendingBeneficiary(addresses.feiDAOTimelock);

  // 2. Set pending beneficiary of vesting investor timelocks to the DAO timelock
  // Investor vesting contracts
  const investorVestingTimelocks = [
    addresses.investorVestingTimelock1,
    addresses.investorVestingTimelock2,
    addresses.investorVestingTimelock3,
    addresses.investorVestingTimelock4,
    addresses.investorVestingTimelock5,
    addresses.investorVestingTimelock6,
    addresses.investorVestingTimelock7,
    addresses.investorVestingTimelock8
  ];

  const investorTimelockBeneficiary = '0xb8f482539f2d3ae2c9ea6076894df36d1f632775';
  const investorBeneficiarySigner = await getImpersonatedSigner(investorTimelockBeneficiary);
  for (let i = 0; i < investorVestingTimelocks.length; i++) {
    const timelock = new ethers.Contract(investorVestingTimelocks[i], timelockABI, investorBeneficiarySigner);
    await timelock.setPendingBeneficiary(addresses.feiDAOTimelock);
  }

  // 3. Set pending beneficiary of vesting team timelock to the DAO timelock
  // Team vesting contracts
  const teamTimelockBeneficiary = '0x3a24fea1509e1baeb2d2a7c819a191aa441825ea';
  const teamBeneficiarySigner = await getImpersonatedSigner(teamTimelockBeneficiary);
  const teamTimelock = new ethers.Contract(addresses.teamVestingTimelock, timelockABI, teamBeneficiarySigner);
  await teamTimelock.setPendingBeneficiary(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate IDO liquidity remover configured
  expect(await contracts.idoLiquidityRemover.UNISWAP_ROUTER()).to.be.equal(addresses.uniswapRouter);
  expect(await contracts.idoLiquidityRemover.FEI_TRIBE_PAIR()).to.be.equal(addresses.feiTribePair);

  // 2. Validate La Tribu clawed back
  expect(await contracts.fei.balanceOf(addresses.laTribuFeiTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.laTribuTribeTimelock)).to.be.equal(0);

  // 3. Validate vesting investor and team timelocks accepted beneficiary
  // TODO

  // 4. IDO LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);

  // 4. IDO FEI should have been burned, TRIBE should have been sent to Treasury
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
