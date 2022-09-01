import { Vm, Vm__factory } from '../../types/contracts';
import { ethers } from 'ethers';

async function main() {
  console.log('Connecting to nodeinator...');
  const provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8999');
  await provider.ready;
  console.log('Nodeinator connected.');
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const vm = new ethers.Contract(
    '0x7109709ECfa91a80626fF3989D68f67F5b1DD12D',
    Vm__factory.createInterface(),
    wallet
  ) as Vm;
  await (await vm['createSelectFork(string)']('http://127.0.0.1:8545')).wait();
  console.log(`Fork reset!`);
}

main();
