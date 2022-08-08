import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Minimum amount of FEI to be redeemed from Uniswap when liquidity removed
const MIN_FEI_OUT = ethers.constants.WeiPerEther.mul(25_000_000);

// Minimum amount of TRIBE to be redeemed from Uniswap when liquidity removed
const MIN_TRIBE_OUT = ethers.constants.WeiPerEther.mul(140_000_000);

const phase_1: TemplatedProposalDescription = {
  title: 'Phase 1: End Fei Labs vesting and remove Uniswap liquidity',
  commands: [
    // 1. Accept the beneficiary of Fei Labs vesting TRIBE timelock contract as the DAO timelock
    {
      target: 'feiLabsVestingTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary on Fei Labs vesting contract as the DAO timelock'
    },

    // 2. Prepare for liquidity removal by accepting timelock beneficiary
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary for Fei Labs IDO Timelock (Uni-LP)'
    },

    // Unlock the LP tokens held by the IDO timelock and transfer to IDO timelock
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'unlockLiquidity()',
      arguments: (addresses) => [],
      description: 'Release all Fei-Tribe LP tokens to the Tribe DAO timelock'
    },
    {
      target: 'feiTribePair',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [
        addresses.idoLiquidityRemover,
        '112766544549135747351497513' // TODO: Update once final claim has been done
      ],
      description: `
      Send Fei Labs yet to be vested LP tokens to the Uniswap liquidity removal contract,
      to allow the liquidity to be removed from Uniswap. 

      There are ~150M LP tokens yet to be vested, 75% of which belong to Fei Labs. 
      Hence ~112M LP tokens are being redeemed from Uniswap.
      `
    },
    {
      target: 'idoLiquidityRemover',
      values: '0',
      method: 'redeemLiquidity(uint256,uint256)',
      arguments: (addresses) => [MIN_FEI_OUT, MIN_TRIBE_OUT],
      description: `
      Remove Fei Labs liquidity from the Uniswap V2 pool by redeeming the LP tokens for FEI and TRIBE.
      
      As part of the contract call, all redeemed FEI is burned and all redeemed TRIBE is sent to Core.
      `
    },
    {
      target: 'feiTribePair',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.investorIDOFundsTimelock, '37588848183045249117165837'],
      description: `
      Transfer unlocked investor FEI-TRIBE LP tokens to a new linear vesting timelock.
      There were ~150M LP tokens unlocked. ~25% of these belong to investors.

      Hence ~38M LP tokens are relocked in the new timelock, on the same terms as the IDO vesting.
      `
    },
    // 3. Revoke the TRIBE approval given to the Tribal Council timelock
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, '0'],
      description: 'Revoke the TRIBE approval given to the Tribal Council timelock'
    }
  ],
  description: `
  Phase 1: End Fei Labs vesting and remove Uniswap liquidity

  This proposal ends the vesting of Fei Labs and removes their LP tokes from Uniswap V2. 
  It then burns all redeemed FEI and sends the redeemed TRIBE to the Core Treasury.

  Specifically, this proposal:
  1. Ends the vesting of Fei Labs, by setting the beneficiary of the vesting contract to the DAO timelock
  2. Accepts the pending beneficiary of the IDO liquidity timelock as the Tribe DAO timelock
  3. Unlocks all Fei-Tribe LP token liquidity held by the IDO timelock, to the DAO timelock
  4. Transfers 75% of the Fei-Tribe LP tokens to a helper Uniswap liquidity removal contract.
     This 75% is the share of the LP tokens that are being vested by Fei-Labs. 
       - The removal contract is then called to remove the corresponding liquidity 
         from Uniswap, burn all redeemed FEI and send all redeemed TRIBE to the Core Treasury.
  `
};

export default phase_1;
