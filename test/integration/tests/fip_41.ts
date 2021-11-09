import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe.only('e2e-fip-41', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

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

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('[WIP] Deposits appropriate amounts & start the auction', async function () {
    const { feiLusdLBPSwapper, feiLusdLBP, fei, lusd } = contracts;

    console.log('FEI balanceOf(feiLusdLBP)', (await fei.balanceOf(feiLusdLBP.address)).toString());
    console.log('FEI balanceOf(feiLusdLBPSwapper)', (await fei.balanceOf(feiLusdLBPSwapper.address)).toString());
    console.log('LUSD balanceOf(feiLusdLBP)', (await lusd.balanceOf(feiLusdLBP.address)).toString());
    console.log('LUSD balanceOf(feiLusdLBPSwapper)', (await lusd.balanceOf(feiLusdLBPSwapper.address)).toString());
  });
});
