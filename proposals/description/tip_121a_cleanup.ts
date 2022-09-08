import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121a_cleanup: TemplatedProposalDescription = {
  title: 'TIP_121a(pt. 2): Technical cleanup, minor role revokation and La Tribu clawback',
  commands: [
    // 6. Clawback La Tribu FEI and TRIBE timelocks
    {
      target: 'laTribuFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribu FEI timelock'
    },
    {
      target: 'laTribuTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribue TRIBE timelock'
    }
  ],
  description: `
  TIP_121a(pt. 2): Technical cleanup, minor role revokation and La Tribu clawback
  
  `
};

export default tip_121a_cleanup;
