import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Minimum amount of FEI to be redeemed from Uniswap when liquidity removed
const MIN_FEI_OUT = ethers.constants.WeiPerEther.mul(40_000_000);

// Minimum amount of TRIBE to be redeemed from Uniswap when liquidity removed
const MIN_TRIBE_OUT = ethers.constants.WeiPerEther.mul(280_000_000);

const ido_liquidity_removal: TemplatedProposalDescription = {
  title: 'Phase 1: Remove vesting FEI and TRIBE, remove Uniswap liquidity',
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
  Phase 1: Remove vesting FEI and TRIBE, remove Uniswap liquidity

  This proposal overall stops the vesting of FEI and TRIBE throughout the ecosystem
  - including Rari Infrastructure team, La Tribu and team - 
  and it also removes all FEI/TRIBE liquidity from Uniswap V2. The redeemed FEI is burned
  whilst the redeemed TRIBE is sent to the Treasury.

  Specifically, this proposal:
  1. Claws back the Rari Infra FEI and TRIBE timelocks
  2. Claws back the La Tribue FEI and TRIBE timelocks
  3. Accepts the beneficiary of all FEI and TRIBE vesting timelocks to a sink contract,
     where the vested funds will become inaccessible
  4. Accepts the pending beneficiary of the IDO liquidity timelock 
     as the Tribe DAO timelock
  5. Unlocks all liquidity - Fei-Tribe LP tokens - held by the timelock.
  6. Transfers the Fei-Tribe LP tokens to a helper contract. This helper contract
     redeems the LP tokens for the underlying FEI and TRIBE tokens in the Uniswap pool.

     It then burns all redeemed FEI and sends all redeemed TRIBE to the Treasury.
  `
};

export default ido_liquidity_removal;
