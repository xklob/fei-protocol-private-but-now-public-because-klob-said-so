import { RariMerkleRedeemer__factory } from '../../types/contracts';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { ethers } from 'ethers';
import { cTokens } from './data/sample/cTokens';
import { rates } from './data/sample/rates';
import { roots } from './data/sample/roots';

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8999');
  await provider.ready;
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory(wallet);
  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address,
    cTokens,
    rates,
    roots
  );
  console.log(`Rari Merkle Redeemer deployed to ${rariMerkleRedeemer.address}`);
}

main();
