import { TemplatedProposalDescription } from '@custom-types/types';

const rari_infra_clawback: TemplatedProposalDescription = {
  title: 'Phase 1b: Rari Infrastructure clawback',
  commands: [
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
    }
    // TODO: Burn all FEI
    // TODO: Send all TRIBE to Core
  ],
  description: `
  Phase 1b: Rari Infrastructure clawback
  
  Clawback the FEI and TRIBE that is vesting to the Rari Infra timelocks, to the Tribal Council
  timelock.
  `
};

export default rari_infra_clawback;
