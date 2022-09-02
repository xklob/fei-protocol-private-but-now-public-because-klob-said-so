import { RariMerkleRedeemer__factory } from '../../types/contracts';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { ethers } from 'ethers';
import { cTokens } from './data/sample/cTokens';
import sampleRates from './data/sample/rates.json';
import sampleRoots from './data/sample/roots.json';

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer [ratesJSONFileName] [rootsJSONFileName] [forkMode]
      
      Args:
        ratesJSONFileName = relative or absolute file locator string (default: "./data/sample/rates.json")
        rootsJSONFileName = relative or absolute file locator string (default: "./data/sample/roots.json")
        forkMode = true | false (default: true)

      Examples: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./data/actual/rates.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./data/actual/rates.json ./data/actual/roots.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./data/actual/rates.json ./data/actual/roots.json true
    `);
    return;
  }

  // todo: sanity check rates & roots

  let provider: ethers.providers.JsonRpcProvider;

  if (process.argv[4] === 'false') {
    provider = new ethers.providers.JsonRpcBatchProvider('http://nodeinator.kryptoklob.io:8545');
  } else {
    provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8999');
  }

  await provider.ready;
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory(wallet);

  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address,
    cTokens,
    sampleRates,
    sampleRoots
  );

  console.log(`Rari Merkle Redeemer deployed to ${rariMerkleRedeemer.address}`);

  // todo: verify if *not* fork
}

main();
