import { ProposalDescription } from '@custom-types/types';

const swap_dpi_to_dai: ProposalDescription = {
  title: 'Swap DPI to DAI',
  commands: [
    {
      target: 'dpi',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{dpiToDaiSwapper}', '37888449801955370645659'],
      description: 'Transfer DPI from DAO timelock to the LBP pool'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{dpiToDaiSwapper}', '187947000000000000000000'],
      description: 'Withdraw Use the PCVGuardian to transfer DAI from the CompoundPCVDeposit to the LBP pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiToDaiLensDai}'],
      description: 'Add DAI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiToDaiLensDpi}'],
      description: 'Add DPI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{dpiDepositWrapper}',
          '{rariPool31FeiPCVDepositWrapper}',
          '{rariPool25FeiPCVDepositWrapper}',
          '{rariPool9RaiPCVDepositWrapper}',
          '{aaveRaiPCVDepositWrapper}',
          '{rariPool19DpiPCVDepositWrapper}',
          '{liquityFusePoolLusdPCVDeposit}',
          '{rariPool72FeiPCVDepositWrapper}',
          '{raiDepositWrapper}'
        ]
      ],
      description: 'Remove DPI Deposit wrapper from CR oracle, as now empty'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', // SWAP_ADMIN_ROLE
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
      ],
      description: 'Transfer admin of SWAP_ADMIN_ROLE to GOVERNOR, so it can be granted to the TribalCouncil'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{tribalCouncilTimelock}'],
      description: 'Grant TribalCouncilTimelock SWAP_ADMIN_ROLE so it can initiate the LBP swap'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816',
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096'
      ],
      description: 'Transfer admin of SWAP_ADMIN_ROLE back to ROLE_ADMIN, so TribalCouncil can control'
    }
  ],
  description: `
  Transfer DPI and DAI to the LBP swapper. This will be used over the course of a month
  to swap DPI for DAI. 
  
  The DAI received will be sent to the Compound DAI deposit, where it can then be dripped to PSM.
  `
};

export default swap_dpi_to_dai;