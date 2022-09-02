import { TemplatedProposalDescription } from '@custom-types/types';

const fip_x: TemplatedProposalDescription = {
  title: 'Deprecate Fei systems',
  commands: [
    {
      target: '',
      values: '',
      method: '',
      arguments: (addresses) => [],
      description: ''
    }
  ],
  description: `
  Deprecatea Fei systems

  This proposal deprecates most Fei systems. It revokes roles and permissions from most contracts
  and pauses relevant contracts.
  `
};

export default fip_x;
