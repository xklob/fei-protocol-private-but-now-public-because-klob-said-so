import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';
import { balances } from '../../proposals/data/hack_repayment_data';

const hashFn = (data: string) => keccak256(data).slice(2);
const ctokens = Object.keys(balances);

const trees: MerkleTree[] = [];
const roots: Buffer[] = [];

for (const ctoken of ctokens) {
  const cTokenBalancesObject = balances[ctoken as keyof typeof balances];
  const cTokenBalancesArray = Object.entries(cTokenBalancesObject);

  const leaves = cTokenBalancesArray.map((x) => solidityKeccak256(['address', 'uint256'], x));
  const tree = new MerkleTree(leaves, hashFn, { sort: true });
  trees.push(tree);

  console.log(`Tree generated. ${tree.getLeaves().length} leaves.`);

  const root = tree.getRoot();
  roots.push(root);

  for (const leaf of leaves) {
    const proof = tree.getHexProof(leaf);
    const verified = tree.verify(proof, leaf, root);
    if (!verified) throw new Error(`Proof for ${leaf} failed`);
  }
}

console.log(`All leaf proofs in all ${trees.length} trees successfully verified.`);
