import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';

const hashFn = (data: string) => keccak256(data).slice(2);

const leaf1 = ['0x11e52c75998fe2E7928B191bfc5B25937Ca16741', '1000000000000000000'];
const leaf2 = ['0x96fa6ACfc5F683Db191234c74D315e5D732b07c0', '1000000000000000000'];

const leaves = [leaf1, leaf2].map((x) => solidityKeccak256(['address', 'uint256'], x));

const tree = new MerkleTree(leaves, hashFn, { sort: true });

const root = tree.getRoot();

const proof1 = tree.getHexProof(leaves[0]);
const proof2 = tree.getHexProof(leaves[1]);

const verified1 = tree.verify(proof1, leaves[0], root);
const verified2 = tree.verify(proof2, leaves[1], root);

console.log(`Leaf 1 Verified: ${verified1}`);
console.log(`Leaf 2 Verified: ${verified2}`);
