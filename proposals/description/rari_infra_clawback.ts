import { TemplatedProposalDescription } from '@custom-types/types';

const rari_infra_clawback: TemplatedProposalDescription = {
  title: 'Phase 1b: Clawback Rari Infra timelocks',
  commands: [
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
    }
  ],
  description: `
  Phase 1b: Clawback Rari Infra timelocks
  
  Clawback the FEI and TRIBE that is vesting to the Rari Infra timelocks.
  `
};

export default rari_infra_clawback;
