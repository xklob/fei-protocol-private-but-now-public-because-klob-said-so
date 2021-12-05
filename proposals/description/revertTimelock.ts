import { ProposalDescription } from '@custom-types/types';

const backstop: ProposalDescription = {
  title: 'FIP-XX: Revert Timelock',
  commands: [
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{timelock}'],
      description: 'Accept new timelock'
    }
  ],
  description: `
  Code:
`
};

export default backstop;
