import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const ido_liquidity_removal: TemplatedProposalDescription = {
  title: 'Remove IDO liquidity from Uniswap V2',
  commands: [
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary for Fei Labs IDO Timelock (Uni-LP)'
    },
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
      description: 'Send all FEI-TRIBE LP tokens to the IDO Liquidity withdrawl helper contract'
    },
    {
      target: 'idoLiquidityRemover',
      values: '0',
      method: 'redeemLiquidity()',
      arguments: (addresses) => [],
      description: 'Remove liquidity from Uniswap pool, convert to FEI and TRIBE and send to destinations'
    },
    // Off-chain, calculate how much additional TRIBE to allocate
    // Plan:
    // 1. Send all recovered FEI to the DAO
    // 2. Burn 10M Fei, which pushes us to 100% stable backed. This removes 10M user circulating FEI
    // 3. Allocate TRIBE from Core to the TRIBE vesting contract, equivalent to the 10M burn
    // 4. Send remaining FEI to the FEI timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [ethers.constants.WeiPerEther.mul(10_000_000)],
      description: 'Burn 10M FEI'
    },
    // How much FEI do I have to send? It can change
    {
      target: 'fei',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [ethers.constants.WeiPerEther.mul(10_000_000)],
      description: 'Send remainder ~30M FEI to the new Fei linear timelock'
    }
  ],
  description: `
  Remove the IDO liquidity of Fei-Tribe from Uniswap V2

  Specifically, this proposal:
  1. Accepts the pending beneficiary of the IDO liquidity timelock 
     as the Tribe DAO timelock
  2. Unlocks all liquidity - Fei-Tribe LP tokens - held by the timelock and sends it to 
     the beneficiary, now the Tribe DAO timelock
  3. Transfers the Fei-Tribe LP tokens to an intermediate contract. This intermediate contract
     will redeem the LP tokens for the underlying Fei and Tribe tokens in the Uniswap pool.
  4. [Flesh out] Convert some amount of FEI into TRIBE
  5. Lock the remaining FEI and TRIBE in new FEI and TRIBE timelocks, which have the same vesting
     properties as the original LP timelock
  `
};

export default ido_liquidity_removal;
