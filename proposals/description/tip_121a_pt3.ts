import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const TC_POD_ID = 25;

const tip_121a_pt3: TemplatedProposalDescription = {
  title: 'TIP-121a (cont.): Sell last LUSD, Timelock and Role Cleanup + La Tribu Clawback',
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
    // ROLE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ROLE_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke ROLE_ADMIN from Tribal Council Timelock'
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
TIP-121a (cont.): Sell last LUSD, Timelock and Role Cleanup + La Tribu Clawback
  
  This proposal is a continuation of the first stage of TIP-121
  (https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475). 
  
  This proposal sells the last ~100k LUSD for DAI using a curve swap. 
  
  It also claws back ~1M FEI and TRIBE from La Tribu, closing out the last DAO funded initiative.
  
It cleans up the timelocks and deprecated roles in the system, where any of these changes can be reversed in a further DAO vote if needed.
  `
};

export default tip_121a_pt3;
