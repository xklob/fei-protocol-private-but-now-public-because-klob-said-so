import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox, getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

// Constants
// LBP swapper
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(100_000); // 100k FEI

/*

TRIBE Buybacks

DEPLOY ACTIONS:

1. Deploy LUSD LBP Swapper
2. Create LUSD LBP pool
3. Init LUSD LBP Swapper

DAO ACTIONS:
1. Set auction duration to 2 weeks
2. Seed LBP Swapper with 100M FEI
3. Start auction
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, fei, lusd, oneConstantOracle, balancerLBPoolFactory } = addresses;

  if (!core) {
    console.log(`core: ${core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create LUSD LBP Swapper
  const feiLusdLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const feiLusdLBPSwapper = await feiLusdLBPSwapperFactory.deploy(
    core,
    {
      _oracle: oneConstantOracle,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    1, // initial duration is 1s at deployment, changed in the proposal
    fei, // tokenSpent
    lusd, // tokenReceived
    core, // send LUSD back to treasury
    MIN_LBP_SIZE
  );

  await feiLusdLBPSwapper.deployTransaction.wait();

  logging && console.log('FEI->LUSD LBP Swapper: ', feiLusdLBPSwapper.address);

  // Create LUSD LBP pool
  const lbpFactory = await ethers.getContractAt('ILiquidityBootstrappingPoolFactory', balancerLBPoolFactory);

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->LUSD Auction Pool',
    'apFEI-LUSD',
    [lusd, fei],
    [ethers.constants.WeiPerEther.div(100), ethers.constants.WeiPerEther.mul(99).div(100)],
    ethers.constants.WeiPerEther.mul(30).div(10_000),
    feiLusdLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const feiLusdLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', feiLusdLBPAddress);

  const feiLusdLBP = await ethers.getContractAt('IWeightedPool', feiLusdLBPAddress);

  // Init LUSD LBP Swapper
  console.log('in deploy() call to init');
  const tx2 = await feiLusdLBPSwapper.init(feiLusdLBPAddress);
  await tx2.wait();
  console.log('deploy end');
  return {
    feiLusdLBPSwapper,
    feiLusdLBP
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('setup');
  // impersonate to get some LUSD, on mainnet a normal swap will be done by OA multisig
  const LUSD_HOLDING_ADDRESS = '0x66017D22b0f8556afDd19FC67041899Eb65a21bb';
  await forceEth(LUSD_HOLDING_ADDRESS);
  const lusdSigner = await getImpersonatedSigner(LUSD_HOLDING_ADDRESS);
  await contracts.lusd
    .connect(lusdSigner)
    .transfer(addresses.feiLusdLBPSwapper, ethers.constants.WeiPerEther.mul(1_011_000));
  console.log('LUSD balance', (await contracts.lusd.balanceOf(addresses.feiLusdLBPSwapper)).toString());
  console.log('FEI balance', (await contracts.fei.balanceOf(addresses.feiLusdLBPSwapper)).toString());
  console.log('end of setup FEI supply', (await contracts.fei.totalSupply()).toString());

  // todo: remove
  console.log('TODO-REMOVE, minting FEI');
  await contracts.fei.mint(contracts.feiLusdLBPSwapper.address, ethers.constants.WeiPerEther.mul(100_000_000));
  console.log('LUSD balance', (await contracts.lusd.balanceOf(addresses.feiLusdLBPSwapper)).toString());
  console.log('FEI balance', (await contracts.fei.balanceOf(addresses.feiLusdLBPSwapper)).toString());
  console.log('after TODO-REMOVE FEI supply', (await contracts.fei.totalSupply()).toString());
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-41');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { feiLusdLBPSwapper, feiLusdLBP } = contracts;
  console.log('validate start');
  console.log('start of validate FEI supply', (await contracts.fei.totalSupply()).toString());
  console.log(
    'start of validate FEI balance on swapper',
    (await contracts.fei.balanceOf(feiLusdLBPSwapper.address)).toString()
  );
  expect(await feiLusdLBPSwapper.isTimeStarted()).to.be.true;

  const price = (await feiLusdLBPSwapper.readOracle())[0];
  console.log('price', price);
  const response = await feiLusdLBPSwapper.getTokensIn(100000);
  console.log('response', response);
  const amounts = response[1];
  console.log('amounts', amounts);
  //expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(100000));
  // TRIBE/FEI price * FEI amount * 1% ~= amount
  //expectApprox(price.mul(100000).div(ethers.constants.WeiPerEther).div(100), amounts[1]);
};
