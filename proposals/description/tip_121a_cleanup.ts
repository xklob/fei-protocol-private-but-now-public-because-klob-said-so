import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const tip_121a_cleanup: TemplatedProposalDescription = {
  title: 'TIP_121a(pt. 3): Technical cleanup, minor role revokation and La Tribu clawback',
  commands: [
    // 1. Revoke non-major Tribe roles
    // GOVERN_ROLE on optimistic governance
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.roleBastion],
      description: 'Revoke GOVERN_ROLE from roleBastion'
    },
    // TOKEMAK_DEPOSIT_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from Tribal Council Timelock'
    },
    // 2. Clawback La Tribu FEI and TRIBE timelocks
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
    },
    // 3. Accept admin of Rari deprecated timelocks
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of the deprecated Rari Infra FEI timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of the deprecated Rari Infra TRIBE timelock'
    }
  ],
  description: `
  TIP_121a(pt. 3): Technical cleanup, minor role revokation and La Tribu clawback
  
  This proposal is a continuation of the first stage of TIP_121
  (https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475). 
  
  It performs the remaining cleanup actions necessary to deprecate the optimistic governance system, 
  revokes minor, non-security related permissions and ends the vesting of the DAO
  funded La Tribu organisation (https://tribe.fei.money/t/fip-83-la-tribu-hiring-devs-from-a-dao-like-structure/3956).

  Specifically, it:
  - Revokes GOVERNOR_ROLE from the optimistic governance RoleBastion contract
  - Revokes the minor, non-security role TOKEMAK_DEPOSIT_ADMIN_ROLE from the Fei system
  - Ends the FEI and TRIBE vesting of La Tribu
  - Has the Tribe DAO timelock accept the admin of the deprecated Rari Infrastructure team timelocks
  `
};

export default tip_121a_cleanup;
