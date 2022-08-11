import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';

const leaf1 = ['0x11e52c75998fe2E7928B191bfc5B25937Ca16741', '1000000000000000000'];
const leaf2 = ['0x96fa6ACfc5F683Db191234c74D315e5D732b07c0', '1000000000000000000'];

const encodedleaf1 = defaultAbiCoder.encode(['address', 'uint256'], leaf1);
const encodedleaf2 = defaultAbiCoder.encode(['address', 'uint256'], leaf2);

const leaves = [encodedleaf1, encodedleaf2].map((x) => keccak256(x));

const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

const root = tree.getRoot();

const proof1 = tree.getHexProof(encodedleaf1);
const proof2 = tree.getHexProof(encodedleaf2);

const verified1 = tree.verify(proof1, encodedleaf1, root);
const verified2 = tree.verify(proof2, encodedleaf2, root);

console.log(`Leaf 1 Verified: ${verified1}`);
console.log(`Leaf 2 Verified: ${verified2}`);
