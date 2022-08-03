import { TemplatedProposalDescription } from '@custom-types/types';

// Existing balance of FEI on the TC to burn
const TC_FEI_TO_BURN = '42905768215167745773610059';

// Clawed back FEI upper bound
const CLAWED_BACK_FEI_UPPER_BOUND = '2897332829955035696312531';

// Clawed back TRIBE upper bound
const CLAWED_BACK_TRIBE_UPPER_BOUND = '3068505367127310595321005';

const phase_1b: TemplatedProposalDescription = {
  title: 'Phase 1b: Rari Infrastructure clawback',
  commands: [
    // 1. Clawback the Rari Infrastructure timelocks
    {
      target: 'newRariInfraFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the FEI from the Rari Infra FEI timelock to the Tribal Council timelock'
    },
    {
      target: 'newRariInfraTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE from the Rari Infra TRIBE timelock to the Tribal Council timelock'
    },

    // 2. Burn the existing FEI on the TC timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_FEI_TO_BURN],
      description: 'Burn all existing 42.9M FEI on the Tribal Council timelock'
    },
    // 3. Grant FEI and TRIBE approvals to DAO timelock, so funds can later be moved
    //    appropriately once final figures are known
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, CLAWED_BACK_FEI_UPPER_BOUND],
      description: `
      Approve the DAO timelock to move all Fei clawed back from the Rari Infra team
      It will later burn it.
      `
    },
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, CLAWED_BACK_TRIBE_UPPER_BOUND],
      description: `
      Approve the DAO timelock to move all TRIBE clawed back from the Rari Infra team.
      It will later send it to Core.
      `
    }
  ],
  description: `
  Phase 1b: Rari Infrastructure clawback
  
  Clawback the FEI and TRIBE that is vesting to the Rari Infra timelocks, to the Tribal Council
  timelock.

  It also burns all pre-existing FEI on the Tribal Council timelock, 42.9M. It then grants FEI and TRIBE
  approvals to the DAO timelock to later burn the FEI and send the TRIBE to Core once 
  final figures are known post clawback. 
  `
};

export default phase_1b;
