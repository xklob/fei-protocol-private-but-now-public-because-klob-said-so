npx ts-node scripts/shutdown/resetFork
npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 2 true
npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/sample/snapshot.json scripts/shutdown/data/test/roots.json true scripts/shutdown/data/sample/testingSnapshot.json
npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/sample/rates.json scripts/shutdown/data/test/roots.json
cp scripts/shutdown/data/sample/testingSnapshot.json ../rari-hack-repayment/src/data/hackRepaymentSnapshot.json
