import { TemplatedProposalDescription } from '@custom-types/types';

const ido_liquidity_removal: TemplatedProposalDescription = {
  title: 'Remove IDO liquidity from Uniswap V2',
  commands: [
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'acceptBeneficiary(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Accept beneficiary for Fei Labs IDO Timelock (Uni-LP)'
    },
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'releaseMax(address)',
      arguments: (addresses) => [],
      description: 'Call releaseMax on IDO timelock to Fei Labs Multisig'
    },
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'unlockLiquidity()',
      arguments: (addresses) => [],
      description: 'Call unlockLiquidity on Fei Labs IDO Timelock'
    },
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'releaseMax(address)',
      arguments: (addresses) => ['{liquidityRemovalHelper}'],
      description: 'Call releaseMax on IDO timelock to intermediary helper contract'
    },
    {
      target: 'liquidityRemovalHelper',
      values: '0',
      method: 'doLiquidityTransfer()',
      arguments: (addresses) => [],
      description: 'Call doLiquidityTransfer on helper contract to transfer liquidity to new timelocks'
    },
    {
      target: 'idoLiquidityTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.guardianMultisig],
      description: 'Set pending beneficiary on old timelock back to guardian multisig'
    }
  ],
  description: `
  Remove the IDO liquidity of Fei-Tribe from Uniswap V2
  `
};

export default ido_liquidity_removal;
