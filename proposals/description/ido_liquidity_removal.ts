import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Minimum amount of FEI to be redeemed from Uniswap when liquidity removed
const MIN_FEI_OUT = ethers.constants.WeiPerEther.mul(40_000_000);

// Minimum amount of TRIBE to be redeemed from Uniswap when liquidity removed
const MIN_TRIBE_OUT = ethers.constants.WeiPerEther.mul(280_000_000);

const ido_liquidity_removal: TemplatedProposalDescription = {
  title: 'Remove IDO liquidity from Uniswap V2',
  commands: [
    // 1. Clawback Rari Infra timelocks
    {
      target: 'newRariInfraFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the FEI from the Rari Infra FEI timelock to the DAO timelock'
    },
    {
      target: 'newRariInfraTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE from the Rari Infra TRIBE timelock to the DAO timelock'
    },

    // 2. Clawback the La Tribu timelocks
    {
      target: 'laTribuFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the FEI from the La Tribu FEI timelock to the DAO timelock'
    },
    {
      target: 'laTribuTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE from the La Tribu FEI timelock to the DAO timelock'
    },

    // 3. Accept the beneficiary of the vesting FEI/TRIBE contracts to a sink contract
    //    ensuring that the TRIBE is inaccessible

    // 4. Prepare for liquidity removal by accepting timelock beneficiary
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary for Fei Labs IDO Timelock (Uni-LP)'
    },

    // Unlock, remove and split the liquidity
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
      arguments: (addresses) => [addresses.idoLiquidityRemover, '170449948038045919878524525'],
      description: 'Send all FEI-TRIBE LP tokens to the IDO Liquidity withdrawal helper contract'
    },

    // WARNING: ASSUMES TIMELOCK.RELEASE_MAX() HAS ALREADY BEEN CALLED TO FUND BENEFICIARY
    {
      target: 'idoLiquidityRemover',
      values: '0',
      method: 'redeemLiquidity(uint256,uint256)',
      arguments: (addresses) => [MIN_FEI_OUT, MIN_TRIBE_OUT],
      description: `
      WARNING: ASSUMES TIMELOCK.RELEASE_MAX() HAS ALREADY BEEN CALLED TO FUND BENEFICIARY

      Remove liquidity from the Uniswap V2 pool by redeeming the LP tokens for FEI and TRIBE.
      
      Then as part of this contract call, burn all FEI redeemed and send all redeemed TRIBE
      to Core
      `
    }
  ],
  description: `
  Remove the IDO liquidity of Fei-Tribe from Uniswap V2

  Specifically, this proposal:
  1. Accepts the pending beneficiary of the IDO liquidity timelock 
     as the Tribe DAO timelock
  2. Unlocks all liquidity - Fei-Tribe LP tokens - held by the timelock.
  3. Transfers the Fei-Tribe LP tokens to a helper contract. This helper contract
     redeems the LP tokens for the underlying FEI and TRIBE tokens in the Uniswap pool.

     It then splits the liquidity accordingly:
     a. Send 10M FEI to the DAO timelock, where it will then be burned. This is enough to 
        push the stable backing to 100%
     b. Send the remaining FEI to the new FEI timelock
     c. Send all unlocked TRIBE liquidity to the new TRIBE timelock
  4. Convert the 10M burned FEI to TRIBE (to cover the investor shortfall from burning)
     and send to the new TRIBE timelock. This is done by allocating from the Core Treasury
     the equivalent amount of TRIBE for the FEI burned.
  `
};

export default ido_liquidity_removal;
