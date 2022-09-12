import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

TIP_121a(pt. 3): Technical cleanup, minor role revokation and La Tribu clawback

*/

// Minimum expected to be clawed back from La Tribu
const MIN_LA_TRIBU_FEI = ethers.constants.WeiPerEther.mul(100_000);
const MIN_LA_TRIBU_TRIBE = ethers.constants.WeiPerEther.mul(100_000);

let initialDAOFeiBalance: BigNumber;
let initialDAOTribeBalance: BigNumber;

const fipNumber = 'tip_121a_cleanup';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialDAOFeiBalance = await contracts.fei.balanceOf(addresses.feiDAOTimelock);
  initialDAOTribeBalance = await contracts.tribe.balanceOf(addresses.feiDAOTimelock);

  // Set pending beneficiary of Rari Infra timelocks to be Fei DAO timelock
  const tcTimelockSigner = await getImpersonatedSigner(addresses.tribalCouncilTimelock);
  await forceEth(addresses.tribalCouncilTimelock);

  await contracts.rariInfraFeiTimelock.connect(tcTimelockSigner).setPendingBeneficiary(addresses.feiDAOTimelock);
  await contracts.rariInfraTribeTimelock.connect(tcTimelockSigner).setPendingBeneficiary(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. No verification of revoked Tribe roles - there are seperate e2e tests for that

  // 2. Clawback of La Tribu FEI and TRIBE timelocks worked
  // Verify no funds on timelocks
  expect(await contracts.fei.balanceOf(addresses.laTribuFeiTimelock)).to.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.laTribuTribeTimelock)).to.equal(0);

  // Verify DAO timelock received FEI and TRIBE
  const daoFeiGain = (await contracts.fei.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOFeiBalance);
  expect(daoFeiGain).to.be.bignumber.greaterThan(MIN_LA_TRIBU_FEI);

  const daoTribeGain = (await contracts.tribe.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOTribeBalance);
  expect(daoTribeGain).to.be.bignumber.greaterThan(MIN_LA_TRIBU_TRIBE);

  // 3. Verify admin accepted on deprecated Rari timelocks
  expect(await contracts.rariInfraFeiTimelock.beneficiary()).to.equal(addresses.feiDAOTimelock);
  expect(await contracts.rariInfraTribeTimelock.beneficiary()).to.equal(addresses.feiDAOTimelock);

  // 4. Verify Tribal Council disbanded
  // Should be 1 member left
  // Should have no roles
  // Gnosis safe should have 1 signer
  const tcPodId = 25;
  const remainingTCMember = '0xc8eefb8b3d50ca87Da7F99a661720148acf97EfA';

  expect(await contracts.podFactory.getNumMembers(tcPodId)).to.equal(1);
  const remainingPodMembers = await contracts.podFactory.getPodMembers(tcPodId);
  expect(remainingPodMembers.length).to.equal(1);
  expect(remainingPodMembers[0]).to.equal(remainingTCMember);
};

export { deploy, setup, teardown, validate };
