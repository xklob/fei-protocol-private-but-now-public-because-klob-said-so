import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

// Total amount of Fei on La Tribu timelock
const LA_TRIBU_FEI_UPPER_BOUND = '1050000000000000000000000';

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
    // MINTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke MINTER_ROLE from PCV Equity Minter'
    },
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke SWAP_ADMIN_ROLE from PCV Equity Minter'
    },
    // 2. Clawback La Tribu FEI and TRIBE timelocks
    // Burn FEI
    {
      target: 'laTribuFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribu FEI timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.ratioPCVControllerV2, LA_TRIBU_FEI_UPPER_BOUND],
      description: 'Approve the ratioPCVController to move the FEI on the La Tribu FEI timelock'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'transferFromRatio(address,address,address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, addresses.fei, addresses.daiFixedPricePSM, '10000'],
      description: `
      Transfer all FEI from the la Tribu FEI timelock to the DAI PSM. It will later be 
      burned.
      `
    },

    // Send TRIBE to Core
    {
      target: 'laTribuTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribue TRIBE timelock'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [
        addresses.core,
        ethers.constants.WeiPerEther.mul(1_000_000) // 1M TRIBE, as cliff not reached
      ],
      description: 'Send all 1M TRIBE clawed back to the Core Treasury'
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
    // 4. Remove Aave PCV Sentinel guard, as now fully withdrawn
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'slay(address)',
      arguments: (addresses) => [addresses.maxFeiWithdrawalGuard],
      description: 'Remove Aave/Compound max Fei withdrawl guard from PCV sentinel'
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
