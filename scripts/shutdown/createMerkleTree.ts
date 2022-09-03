import { ethers } from 'ethers';
import fs from 'fs';
import { cTokens } from './data/prod/cTokens';
import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/createMerkleTree [dataJSONFilename] [additionalDataJSONFilename] [outputPath] [debug]
      
      Args:
        dataJSONFilename = string (default: "./scripts/shutdown/data/sample/snapshot.json")
        additionalDataJSONFilename = string (default: "./scripts/shutdown/data/sample/fakeSnapshot.json")
        outputFilename = string (default: "./scripts/shutdown/data/sample/merkleRoots.json")
        debug = true | false (default: false)
      
      Examples: 
        npx ts-node scripts/shutdown/createMerkleTree
        npx ts-node scripts/shutdown/createMerkleTree prod/snapshot.json
        npx ts-node scripts/shutdown/createMerkleTree sample/snapshot.json sample/testingSnapshot.json prod/roots.json true
    `);
    return;
  }

  let dataJSONFilename = './scripts/shutdown/data/sample/snapshot.json';
  let extraDataJSONFilename = undefined;
  let outputFilename = './scripts/shutdown/data/sample/merkleRoots.json';
  let debug = false;

  if (process.argv[2] !== undefined) {
    dataJSONFilename = process.argv[2];
  }

  if (process.argv[3] !== undefined) {
    extraDataJSONFilename = process.argv[3];
  }

  if (process.argv[4] !== undefined) {
    outputFilename = process.argv[4];
  }

  if (process.argv[5] !== undefined) {
    debug = process.argv[5] === 'true';
  }

  const balances: { [key: string]: { [key: string]: string } } = JSON.parse(fs.readFileSync(dataJSONFilename).toString());

  if (extraDataJSONFilename !== undefined) {
    const extraBalances: { [key: string]: { [key: string]: string } } = JSON.parse(fs.readFileSync(extraDataJSONFilename).toString());

    // merge the data in each
    Object.keys(extraBalances).forEach((key) => {
      balances[key] = { ...balances[key], ...extraBalances[key] };
    });
  }

  /*

  data format:
  {
    cTokenAddress : {
      holderAddress1 : amount1,
      holderAddress2 : amount2
      ...
    }
  }

  */

  // should have 27 keys, one for each ctoken, and all of the 27 ctoken addresses exactly
  if (Object.keys(balances).length !== 27)
    throw new Error(`Snapshot data should have 27 keys, one for each ctoken. Actual: ${Object.keys(balances).length}`);
  if (Object.keys(balances).some((key) => !cTokens.includes(key))) throw new Error(`Snapshot data has invalid ctoken address`);

  // @todo perhaps further validation if we need it

  // create 27 merkle trees & output them to folder

  const trees: MerkleTree[] = [];
  const roots: Buffer[] = [];
  const hexRoots: { [key: string]: string } = {};

  const hashFn = (data: string) => keccak256(data).slice(2);

  for (const cTokenAddress of Object.keys(balances)) {
    const cTokenBalancesData = balances[cTokenAddress];
    const cTokenBalancesArray = Object.entries(cTokenBalancesData);

    const leaves = cTokenBalancesArray.map((x) => solidityKeccak256(['address', 'uint256'], x));
    const tree = new MerkleTree(leaves, hashFn, { sort: true });

    trees.push(tree);

    if (debug) console.log(`Tree generated. ${tree.getLeaves().length} leaves.`);

    const root = tree.getRoot();
    const hexRoot = tree.getHexRoot();
    roots.push(root);
    hexRoots[cTokenAddress] = hexRoot;

    for (const leaf of leaves) {
      const proof = tree.getHexProof(leaf);
      const verified = tree.verify(proof, leaf, root);
      if (!verified) throw new Error(`Proof for ${leaf} failed`);
    }
  }

  if (debug) console.log('All trees & roots generated & roots verified.');

  fs.writeFileSync(`${outputFilename}`, JSON.stringify(hexRoots, null, 2));

  console.log(`Merkle roots written to ${outputFilename}`);
}

main();
