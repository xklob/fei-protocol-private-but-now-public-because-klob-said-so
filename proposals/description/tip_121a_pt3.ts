import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const TC_POD_ID = 25;

const tip_121a_pt3: TemplatedProposalDescription = {
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
    },
    // 4. Disband Tribal Council by removing pod members
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchRemovePodMember(uint256,address[])',
      arguments: (addresses) => [
        TC_POD_ID,
        [
          '0x72b7448f470D07222Dbf038407cD69CC380683F3',
          '0xA6D08774604d6Da7C96684ca6c4f61f89c4e5b96',
          '0xe0ac4559739bD36f0913FB0A3f5bFC19BCBaCD52',
          '0xC2138f77E97A9Ac0A4bC26F42D80D29D1a091866',
          '0x9f5e6F58CC8823D3c022AeBE3942EeF689E9AcD9',
          '0xaB339ae6eab3C3CF4f5885E56F7B49391a01DDA6',
          '0xd90E9181B20D8D1B5034d9f5737804Da182039F6',
          '0x7671f0615B1764fb4bf4b8dF06B7338843f99678'
        ]
      ],
      description: `
        Disband the Tribal Council by removing all but one pod member.
        The remaining pod member will transfer ownership to a zero address
      `
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
  - Revokes remaining access roles granted to the optimistic governance smart contracts
  - Disbands the Tribal Council, by removing all members from the Tribal Council Safe/Pod
  - Revokes the minor, non-security role TOKEMAK_DEPOSIT_ADMIN_ROLE from the Fei system
  - Ends the FEI and TRIBE vesting of La Tribu
  - Has the Tribe DAO timelock accept the admin of the deprecated Rari Infrastructure team timelocks
  `
};

export default tip_121a_pt3;
