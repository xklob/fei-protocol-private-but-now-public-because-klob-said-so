import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { BigNumber } from 'ethers';
import { abi as timelockABI } from '../../artifacts/contracts/timelocks/TimelockedDelegator.sol/TimelockedDelegator.json';
import { ERC20, LinearEarlyUnlockTimelock } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

/*

Phase 1: End Fei Labs vesting and remove Uniswap liquidity

1. Accept the beneficiary of the Fei Labs vesting timelock to the DAO timelock
   effectively clawing it back
2. Unlock the Fei Labs IDO liquidity, burn the FEI and send the TRIBE to the Core Treasury
3. Re-lock investors vesting LP tokens

*/

const fipNumber = 'phase_1_clawback_remove_liquidity';

// Approximate bounds on the FEI to be burned after LP tokens redeemed
const LOWER_BOUND_FEI = ethers.constants.WeiPerEther.mul(25_000_000);
const UPPER_BOUND_FEI = ethers.constants.WeiPerEther.mul(35_000_000);

// Expected bounds on the TRIBE to be transferred to the Core Treasury after LP tokens redeemed
const LOWER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(140_000_000);
const UPPER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(240_000_000);

// Expected bounds on the number of FEI-TRIBE LP tokens to be relocked for Investors in a timelock
const LOWER_BOUND_LP_TOKENS = ethers.constants.WeiPerEther.mul(30_000_000);
const UPPER_BOUND_LP_TOKENS = ethers.constants.WeiPerEther.mul(50_000_000);

// Fei Labs LP tokens to release
const LABS_LP_TOKENS_VESTED = ethers.constants.WeiPerEther.mul(20_000_000);

// Fei Labs TRIBE tokens to release
const LABS_TRIBE_TOKENS_VESTED = ethers.constants.WeiPerEther.mul(43_170_000);

// DAO timelock TRIBE sent to Core
const DAO_TIMELOCK_TRIBE = toBN('16928757542558284368284929');

let initialFeiTotalSupply: BigNumber;
let initialTribeTreasuryBalance: BigNumber;
let initialLabsLPTokens: BigNumber;
let initialLabsTribeTokens: BigNumber;
let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy new linear token timelock to hold the remaining investor LP tokens
  // Get the remaining duration on the IDO timelock
  const idoLiquidityTimelock = await ethers.getContractAt('LinearTokenTimelock', addresses.idoLiquidityTimelock);
  const idoTimelockRemainingDuration = await idoLiquidityTimelock.remainingTime();
  console.log('Remaining time: ', idoTimelockRemainingDuration.toString());

  const LinearTokenTimelockedFactory = await ethers.getContractFactory('LinearEarlyUnlockTimelock');
  const investorIDOFundsTimelock = await LinearTokenTimelockedFactory.deploy(
    addresses.core,
    addresses.feiLabsTreasuryMultisig, // beneficiary
    idoTimelockRemainingDuration, // duration
    addresses.feiTribePair, // token - FEI/TRIBE LP tokens
    0, // secondsUntilCliff - have already passed the cliff

    // clawbackAdmin - NO CLAWBACK ADMIN. Make use of unlockLiquidity() onlyGovernor instead
    ethers.constants.AddressZero,
    0 // startTime
  );
  await investorIDOFundsTimelock.deployTransaction.wait();

  logging && console.log('New investor IDO timelock deployed to: ', investorIDOFundsTimelock.address);

  // 2. Deploy IDO Liquidity Remover helper contract
  const IDOLiquidityRemovalFactory = await ethers.getContractFactory('IDOLiquidityRemover');
  const idoLiquidityRemover = await IDOLiquidityRemovalFactory.deploy(addresses.core);
  await idoLiquidityRemover.deployTransaction.wait();
  console.log('IDO liquidity remover deployed to: ', idoLiquidityRemover.address);

  return {
    idoLiquidityRemover,
    investorIDOFundsTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialFeiTotalSupply = await contracts.fei.totalSupply();
  initialTribeTreasuryBalance = await contracts.tribe.balanceOf(addresses.core);
  initialLabsLPTokens = await contracts.feiTribePair.balanceOf(addresses.feiLabsTreasuryMultisig);
  initialLabsTribeTokens = await contracts.tribe.balanceOf(addresses.feiLabsTreasuryMultisig);

  // 1. Call release(to, amount) on the IDO Liquidity Timelock to release specific amount of vested liquidity
  //    This is Fei Labs claiming it's vested LP tokens
  const feiLabsTreasurySigner = await getImpersonatedSigner(addresses.feiLabsTreasuryMultisig);
  await contracts.idoLiquidityTimelock
    .connect(feiLabsTreasurySigner)
    .release(addresses.feiLabsTreasuryMultisig, LABS_LP_TOKENS_VESTED);

  // 2. Set pending beneficiary of IDO liquidity timelock to the DAO timelock
  await contracts.idoLiquidityTimelock.connect(feiLabsTreasurySigner).setPendingBeneficiary(addresses.feiDAOTimelock);

  // 3. Call release(to,amount) on Fei Labs timelock, claim Fei Labs vested TRIBE
  const feiLabsTribeTimelock = new ethers.Contract(
    addresses.feiLabsVestingTimelock,
    timelockABI,
    feiLabsTreasurySigner
  );

  // Undelegate enough funds to be able to claim vested TRIBE
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate1);
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate2);
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate3);
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate4);
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate5);
  await contracts.feiLabsVestingTimelock.connect(feiLabsTreasurySigner).undelegate(addresses.tribeFeiLabsDelegate6);

  // Claim the Fei Labs vested TRIBE funds
  await feiLabsTribeTimelock
    .connect(feiLabsTreasurySigner)
    .release(addresses.feiLabsTreasuryMultisig, LABS_TRIBE_TOKENS_VESTED);

  // 4. Set pending beneficiary of vesting team TRIBE timelock to the DAO timelock
  await feiLabsTribeTimelock.connect(feiLabsTreasurySigner).setPendingBeneficiary(addresses.feiDAOTimelock);

  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate investor IDO funds timelock configured
  expect(await contracts.investorIDOFundsTimelock.beneficiary()).to.be.equal(addresses.feiLabsTreasuryMultisig);
  expect(await contracts.investorIDOFundsTimelock.clawbackAdmin()).to.be.equal(ethers.constants.AddressZero);
  expect(await contracts.investorIDOFundsTimelock.lockedToken()).to.be.equal(addresses.feiTribePair);
  // expect(await contracts.investorIDOFundsTimelock.duration()).to.be.equal();
  expect(await contracts.investorIDOFundsTimelock.cliffSeconds()).to.be.equal(0);

  // 2. Validate IDO liquidity remover configured
  expect(await contracts.idoLiquidityRemover.UNISWAP_ROUTER()).to.be.equal(addresses.uniswapRouter);
  expect(await contracts.idoLiquidityRemover.FEI_TRIBE_PAIR()).to.be.equal(addresses.feiTribePair);

  // 3. Validate Fei Labs vesting timelock accepted beneficiary
  expect(await contracts.feiLabsVestingTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);

  // 4. IDO LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.idoLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.feiTribeLBP.balanceOf(addresses.feiDAOTimelock)).to.be.equal(0);

  // 5. IDO FEI should have been burned, TRIBE should have been sent to Treasury
  // There are ~170M Fei-Tribe LP tokens, worth ~$92M.
  // 20M have been vested and are expected to be claimed
  // That leaves ~150M Fei-Tribe LP tokens (worth ~$82M) that are still vesting
  // to Fei Labs and Investors

  // Investors have ~25% of the LP tokens vesting, Fei Labs the remaining 75%
  // So ~112M Fei-Tribe Fei Labs LP tokens are being redeemed and liquidity removed
  // and ~38M are being relocked for investors in a linear timelock on the same terms

  // Calculation for expected amount of FEI and TRIBE burned
  // 112M LP tokens removed, worth ~$61M
  // Constant product AMM => ~$30M FEI, $30M TRIBE
  // 1 FEI = $1, 1 TRIBE ~= $0.16
  // => 30M FEI burned and ~190M TRIBE sent to Core

  // In addition, ~17M TRIBE is being sent to Core from the DAO timelock
  const feiBurned = initialFeiTotalSupply.sub(await contracts.fei.totalSupply());
  console.log('FEI redeemed and burned from IDO liquidity [M]e18: ', Number(feiBurned) / 1e24);
  expect(feiBurned).to.be.bignumber.greaterThan(LOWER_BOUND_FEI);
  expect(feiBurned).to.be.bignumber.lessThan(UPPER_BOUND_FEI);

  // Validate TRIBE sent to Treasury
  const tribeRedeemed = (await contracts.tribe.balanceOf(addresses.core))
    .sub(initialTribeTreasuryBalance)
    .sub(DAO_TIMELOCK_TRIBE);
  expect(tribeRedeemed).to.be.bignumber.greaterThan(LOWER_BOUND_TRIBE);
  expect(tribeRedeemed).to.be.bignumber.lessThan(UPPER_BOUND_TRIBE);
  console.log('TRIBE redeemed from IDO liquidity [M]e18: ', Number(tribeRedeemed) / 1e24);

  // 6. Validate investor LP tokens
  const investorIDOTimelockFunds = await contracts.feiTribePair.balanceOf(addresses.investorIDOFundsTimelock);
  console.log('Investor LP tokens locked in new timelock [M]e18: ', Number(investorIDOTimelockFunds) / 1e24);
  expect(investorIDOTimelockFunds).to.be.bignumber.greaterThan(LOWER_BOUND_LP_TOKENS);
  expect(investorIDOTimelockFunds).to.be.bignumber.lessThan(UPPER_BOUND_LP_TOKENS);

  const remainingLPTokensInIDOTimelock = await contracts.feiTribePair.balanceOf(addresses.idoLiquidityTimelock);
  expect(remainingLPTokensInIDOTimelock).to.be.equal(0);

  // 7. Validate TRIBE approval revoked from Tribal Council timelock
  expect(await contracts.tribe.allowance(addresses.feiDAOTimelock, addresses.tribalCouncilTimelock)).to.equal(0);

  // 8. Validate DAO Timelock has no more TRIBE
  expect(await contracts.tribe.balanceOf(addresses.feiDAOTimelock)).to.be.equal(0);

  // 9. Validate Fei Labs vested funds
  const feiLabsClaimedLPTokens = (await contracts.feiTribePair.balanceOf(addresses.feiLabsTreasuryMultisig)).sub(
    initialLabsLPTokens
  );
  expect(feiLabsClaimedLPTokens).to.be.equal(LABS_LP_TOKENS_VESTED);

  const feiLabsClaimedTribe = (await contracts.tribe.balanceOf(addresses.feiLabsTreasuryMultisig)).sub(
    initialLabsTribeTokens
  );
  expect(feiLabsClaimedTribe).to.be.equal(LABS_TRIBE_TOKENS_VESTED);

  // 9. Validate that investor early unlock beneficiary can claim from linear vesting timelock
  await validateBeneficiaryCanClaim(
    contracts.investorIDOFundsTimelock as LinearEarlyUnlockTimelock,
    contracts.feiTribePair as ERC20,
    addresses.feiLabsTreasuryMultisig
  );

  // 11. Sanity check PCV stats:
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', Number(pcvStatsBefore.protocolControlledValue) / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', Number(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', Number(pcvStatsBefore.protocolEquity) / 1e24);
  const pcvStatsAfter: PcvStats = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', Number(pcvStatsAfter.protocolControlledValue) / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', Number(pcvStatsAfter.userCirculatingFei) / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', Number(pcvStatsAfter.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');
};

const validateBeneficiaryCanClaim = async (
  tokenTimelock: LinearEarlyUnlockTimelock,
  feiTribePair: ERC20,
  beneficiary: string
) => {
  const beneficiaryBalanceBefore = await feiTribePair.balanceOf(beneficiary);

  const feiLabsTreasurySigner = await getImpersonatedSigner(beneficiary);
  await tokenTimelock.connect(feiLabsTreasurySigner).releaseMax(beneficiary);

  const balanceDiff = (await feiTribePair.balanceOf(beneficiary)).sub(beneficiaryBalanceBefore);
  expect(balanceDiff).to.be.bignumber.greaterThan(toBN(0));
};

export { deploy, setup, teardown, validate };
