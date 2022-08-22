import { TemplatedProposalDescription } from '@custom-types/types';

const phase2: TemplatedProposalDescription = {
  title: 'Part 2: RariFuse Hack Repayment',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.rariMerkleRedeemer, '10000000000000000000000'], // @todo - hardcoded for now, fix later
      description: 'Mint Fei to the RariMerkleRedeemer'
    }
  ],
  description: `
  [Part 2: RariFuse Hack Repayment] /n/n
  [<does stuff>] \n\n
  ` // @todo - add description
};

export default phase2;
