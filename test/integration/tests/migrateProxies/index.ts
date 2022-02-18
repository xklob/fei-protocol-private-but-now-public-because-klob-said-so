import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { resetFork, performDAOAction } from '@test/helpers';
import { fip_79aCalldata, fip_79bCalldata, fip_79cCalldata } from './proposalCalldata';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '../../setup/utils';

const reduceDAOVotingPeriod = async (feiDAO: Contract, senderAddress: string) => {
  const calldatas = [
    '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a' // set voting delay 10
  ];
  const targets = [feiDAO.address];
  const values = [0];
  await performDAOAction(feiDAO, senderAddress, calldatas, targets, values);
};

describe.only('Migrate proxies', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let feiDAO: Contract;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    // Don't pass any proposals, to avoid simulating
    e2eCoord = new TestEndtoEndCoordinator(config);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    feiDAO = contracts.feiDAO;

    await forceEth(feiDAO.address);
    await reduceDAOVotingPeriod(feiDAO, contractAddresses.multisig);
  });

  it('should give Rari timelock governor and point FEI DAO timelock to oldTimelock (fip_79a)', async () => {
    const GOVERN_ROLE = ethers.utils.id('GOVERN_ROLE');
    const initialRariTimelockHasRole = await contracts.core.hasRole(GOVERN_ROLE, contractAddresses.rariTimelock);
    const initialOldTimelockHasRole = await contracts.core.hasRole(GOVERN_ROLE, contractAddresses.timelock);
    const initialFeiDAOTimelock = await feiDAO.timelock();
    const newTimelockHasRole = await contracts.core.hasRole(GOVERN_ROLE, contractAddresses.feiDAOTimelock);

    expect(initialRariTimelockHasRole).to.be.false;
    expect(initialOldTimelockHasRole).to.be.true;

    // Initial timelock is the new one
    expect(initialFeiDAOTimelock).to.equal(contractAddresses.feiDAOTimelock);
    expect(newTimelockHasRole).to.be.true;

    // Multisig address has sufficient TRIBE to pass quorum
    const targets = [contractAddresses.core, contractAddresses.core, feiDAO.address];
    const values = [0, 0, 0];
    await performDAOAction(feiDAO, contractAddresses.multisig, fip_79aCalldata, targets, values);

    // 1. Rari timelock granted GOVERN_ROLE role
    const rariTimelockHasRole = await contracts.core.hasRole(GOVERN_ROLE, contractAddresses.rariTimelock);
    expect(rariTimelockHasRole).to.be.true;

    // 2. oldTimelock has GOVERN_ROLE revoked
    const oldTimelockHasRole = await contracts.core.hasRole(GOVERN_ROLE, contractAddresses.timelock);
    expect(oldTimelockHasRole).to.be.false;

    // 3. FEI DAO pointing to oldTimelock
    const daoTimelock = await feiDAO.timelock();
    expect(daoTimelock).to.equal(contractAddresses.timelock);
  });

  it('should migrate proxies from oldTimelock to newTimelock (fip_79b)', async () => {
    const proxyAdmin = contracts.proxyAdmin;
    const initialProxyAdminOwner = await proxyAdmin.owner();
    expect(initialProxyAdminOwner).to.equal(contractAddresses.timelock);

    const initialFeiDAOTimelock = await feiDAO.timelock();
    expect(initialFeiDAOTimelock).to.equal(contractAddresses.timelock);

    const values = [0, 0, 0, 0];
    const targets = [
      contractAddresses.proxyAdmin,
      contractAddresses.timelock,
      contractAddresses.timelock,
      contractAddresses.feiDAO
    ];
    await performDAOAction(feiDAO, contractAddresses.multisig, fip_79bCalldata, targets, values);

    // 1. Check ProxyAdmin owner changed to newTimelock
    const newTimelockAddress = contractAddresses.feiDAOTimelock;
    const newOwner = await proxyAdmin.owner();
    expect(newOwner).to.equal(newTimelockAddress);

    // 2. Check that oldTimelock delay set to 0 and pendingAdmin set to newTimelock
    const oldTimelock = contracts.timelock;
    const oldTimelockDelay = await oldTimelock.delay();
    expect(oldTimelockDelay).to.equal(0);

    const oldTimelockPendingAdmin = await oldTimelock.pendingAdmin();
    expect(oldTimelockPendingAdmin).to.equal(newTimelockAddress);

    // 3. Check that FEIDAO timelock updated to newTimelock
    const feiDAOTimelock = await feiDAO.timelock();
    expect(feiDAOTimelock).to.equal(newTimelockAddress);
  });

  it('should accept newTimelock as admin on oldTimelock', async () => {
    const oldTimelock = contracts.timelock;

    const initialOldTimelockAdmin = await oldTimelock.admin();
    expect(initialOldTimelockAdmin).to.equal(contractAddresses.feiDAO);

    const values = [0];
    const targets = [contractAddresses.timelock];
    await performDAOAction(feiDAO, contractAddresses.multisig, fip_79cCalldata, targets, values);

    const oldTimelockAdmin = await oldTimelock.admin();
    expect(oldTimelockAdmin).to.equal(contractAddresses.feiDAOTimelock);
  });

  // End result:
  // 1. oldTimelock admin = newTimelock
  // 2. Owner of proxyAdmin (and therefore able to make upgrades) = newTimelock
});
