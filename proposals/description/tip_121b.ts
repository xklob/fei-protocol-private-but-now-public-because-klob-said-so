import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121b: TemplatedProposalDescription = {
  title: 'Part 2: RariFuse Hack Repayment',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.merkleRedeemerDripper, '10000000000000000000000'], // @todo - hardcoded for now, fix later
      description: 'Mint Fei to the MerkleRedeemerDripper'
    }
  ],
  description: `
  [Part 2: RariFuse Hack Repayment] /n/n
  [<does stuff>] \n\n
  ` // @todo - add description
};

export default tip_121b;
