import { ProposalDescription } from '@custom-types/types';

const fip_88: ProposalDescription = {
  title: 'FIP-88: Remove GOVERNOR role from Rari timelock',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERN_ROLE
        '{rariTimelock}'
      ],
      description: 'Revoke GOVERNOR role from Rari timelock'
    }
  ],
  description: `
  This FIP revokes the GOVERNOR role from the Rari timelock as a safety mechanism.`
};

export default fip_88;
