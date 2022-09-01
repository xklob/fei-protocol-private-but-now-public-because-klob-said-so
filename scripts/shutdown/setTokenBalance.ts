import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { BigNumber, ethers } from 'ethers';
import { ExternalTest__factory } from '../../types/contracts';
import { cTokens } from './data/sample/cTokens';
import { parseEther, parseUnits } from 'ethers/lib/utils';

async function main(cToken: string, giveTo: string, amount: BigNumber) {
  console.log('Connecting to nodeinator...');
  const provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8999');
  await provider.ready;
  console.log('Nodeinator connected.');
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const testFactory = new ExternalTest__factory(wallet);
  console.log('Deploying test contract...');
  const test = await testFactory.deploy({ gasLimit: 10000000 });
  console.log(`ExternalTest.sol deployed to ${test.address}`);
  await (await test.getTokens(cToken, giveTo, amount, { gasLimit: 10000000 })).wait();
  console.log(`Gave ${amount} of cToken: ${cToken} to ${giveTo}`);
}

main(MainnetContractsConfig.fei.address, '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', parseEther('1'));
