import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';

/*

IDO liquidity removal

1. Transfer ownership of the IDO liquidity to the DAO timelock
2. Early unlock the IDO liquidity and split liquidity
3. Convert an amount of FEI into TRIBE
4. Lock remaining in new timelocks

Beneficiary of the IDO liquidity is
*/

const fipNumber = 'ido_liquidity_removal';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  // Deploy new FEI and TRIBE vesting timelocks for new liquidity here
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Set pending beneficiary to the DAO timelock
  const beneficiary = '0x3A24fea1509e1BaeB2D2A7C819A191AA441825ea';
  const beneficiarySigner = await getImpersonatedSigner(beneficiary);
  await contracts.idoLiquidityTimelock.connect(beneficiarySigner).setPendingBeneficiary(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in validate for fip${fipNumber}`);
};

export { deploy, setup, teardown, validate };
