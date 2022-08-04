import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Minimum amount of FEI to be redeemed from Uniswap when liquidity removed
const MIN_FEI_OUT = ethers.constants.WeiPerEther.mul(35_000_000);

// Minimum amount of TRIBE to be redeemed from Uniswap when liquidity removed
const MIN_TRIBE_OUT = ethers.constants.WeiPerEther.mul(200_000_000);

const phase_1: TemplatedProposalDescription = {
  title: 'Phase 1: Clawback vesting TRIBE and FEI and remove Uniswap liquidity',
  commands: [
    // 1. Clawback the La Tribu timelocks
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

    // 2. Accept the beneficiary of the team vesting TRIBE timelock contracts as the DAO timelock
    {
      target: 'teamVestingTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary on team vesting contract as the DAO timelock'
    },

    // 3. Prepare for liquidity removal by accepting timelock beneficiary
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
        '150982632529460334523068014' // TODO: Update once final claim has been done
      ],
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
    },
    // 4. Revoke the TRIBE approval given to the Tribal Council timelock
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, '0'],
      description: 'Revoke the TRIBE approval given to the Tribal Council timelock'
    }
  ],
  description: `
  Phase 1: Clawback vesting TRIBE and FEI and remove Uniswap liquidity

  This proposal overall stops the vesting of FEI and TRIBE throughout the ecosystem, including
  La Tribu and the team, and it also removes all FEI/TRIBE liquidity from Uniswap V2.
  The redeemed FEI is burned whilst the redeemed TRIBE is sent to the Treasury.

  Specifically, this proposal:
  1. Claws back the La Tribu FEI and TRIBE timelocks
  2. Accepts the beneficiary of all FEI and TRIBE vesting timelocks as the DAO timelock
  3. Accepts the pending beneficiary of the IDO liquidity timelock 
     as the Tribe DAO timelock
  4. Unlocks all liquidity - Fei-Tribe LP tokens - held by the timelock.
  5. Transfers the Fei-Tribe LP tokens to a helper contract. This helper contract
     redeems the LP tokens for the underlying FEI and TRIBE tokens in the Uniswap pool.

     It then burns all redeemed FEI and sends all redeemed TRIBE to the Treasury.
  `
};

export default phase_1;
