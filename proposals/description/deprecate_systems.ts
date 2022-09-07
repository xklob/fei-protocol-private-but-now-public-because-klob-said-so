import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

const deprecate_systems: TemplatedProposalDescription = {
  title: 'TIP_121c: Deprecate Tribe DAO and Fei sub-systems',
  commands: [
    // 1. Revoke all non-final Tribe roles
    // MINTER
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke MINTER_ROLE from pcvEquityMinter'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke MINTER_ROLE from feiDAOTimelock'
    },
    // GOVERN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.roleBastion],
      description: 'Revoke GOVERN_ROLE from roleBastion'
    },
    // PCV_CONTROLLER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke PCV_CONTROLLER_ROLE from feiDAOTimelock'
    },
    // GUARDIAN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvSentinel],
      description: 'Revoke GUARDIAN from PCV Sentinel'
    },
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke SWAP_ADMIN_ROLE from pcvEquityMinter'
    },
    // METAGOVERNANCE roles
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_VOTE_ADMIN from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_TOKEN_STAKING from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_GAUGE_ADMIN from feiDAOTimelock'
    },
    // FEI_MINT_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('FEI_MINT_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke FEI_MINT_ADMIN from feiDAOTimelock'
    },
    // PCV_MINOR_PARAM_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke PCV_MINOR_PARAM_ROLE from feiDAOTimelock'
    },
    // TOKEMAK_DEPOSIT_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from feiDAOTimelock'
    },
    // 2. Deprecate Tribe Minter
    {
      target: 'tribeMinter',
      values: '0',
      method: 'setAnnualMaxInflationBasisPoints(uint256)',
      arguments: (addresses) => ['1'],
      description: 'Set Tribe minter max annual inflation to the minimum of 0.01% (1 basis point)'
    },
    {
      target: 'tribeMinter',
      values: '0',
      method: 'setMinter(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: `
        Set Tribe minter address to DAO timelock. This is an intermediate step and a subsequent action
        will set the minter address to the zero address, effectively burning it (Tribe Minter doesn't allow
        setting to zero).
      `
    },
    {
      target: 'tribe',
      values: '0',
      method: 'setMinter(address)',
      arguments: (addresses) => [ethers.constants.AddressZero],
      description: 'Set Tribe minter address to the Zero address'
    },
    // 3. Deprecate the PCV Sentinel
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'slay(address)',
      arguments: (addresses) => [addresses.fuseWithdrawalGuard],
      description: 'Remove FuseWithdrawlGuard from PCV Sentinel'
    },
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'slay(address)',
      arguments: (addresses) => [addresses.maxFeiWithdrawalGuard],
      description: 'Remove Aave/Compound max Fei withdrawl guard from PCV sentinel'
    },
    // 4. Deprecate Tribe Reserve Stabiliser
    {
      target: 'tribeReserveStabilizer',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause Tribe Reserve Stabilizer, prevent exchangeFei() being called'
    },
    // 5. Deprecate ProxyAdmin
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'transferOwnership(address)',
      arguments: (addresses) => [ADDRESS_ONE],
      description: `
        Transfer ownership of ProxyAdmin to 0x1 address, to prevent any future upgrades.
        The version of Ownable the ProxyAdmin contract inherits from prevents ownership
        transfers to the zero address
      `
    }
  ],
  description: `
  TIP_121c: Deprecate Tribe DAO and Fei sub-systems
  1. Revoke all Tribe Roles
  2. Deprecate TribeMinter - set inflation to 0% and transfer minter to DAO timelock.
                             Subsequent proposal will set it to zero address
  3. Deprecate PCV Sentinel - remove all guards
  4. Deprecate Tribe Reserve Stabiliser
  5. Deprecate ProxyAdmin - revoke ownership so future upgrades not possible
  `
};

export default deprecate_systems;
