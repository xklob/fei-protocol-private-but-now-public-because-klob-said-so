import { ProposalDescription } from '@custom-types/types';

const fip_99: ProposalDescription = {
  title: 'FIP-99: Sell RAI',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address, address, uint256)',
      arguments: ['{rariPool9RaiPCVDeposit}', '{aaveRaiPCVDeposit}', '8000'],
      description: 'Withdraw all Rai from the rari pool 9 pcv deposit and sent to the aave rai pcv deposit'
    },
    {
      target: 'aaveRaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Call deposit() on the aave rai pcv deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{raiPriceBoundPSM}'],
      description: 'Grant the MINTER_ROLE to the raiPriceBoundPSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{raiPCVDripController}'],
      description: 'Grant the PCV_CONTROLLER_ROLE to the rai pcv drip controller'
    },
    {
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: [],
      description: 'Pause redeem on the rai price-bound psm'
    }
  ],
  description: 'Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure'
};

export default fip_99;
