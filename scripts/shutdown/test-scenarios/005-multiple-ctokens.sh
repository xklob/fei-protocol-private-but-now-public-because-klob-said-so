npx ts-node scripts/shutdown/resetFork
npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 10 true
npx ts-node scripts/shutdown/setTokenBalance 0xbb025d470162cc5ea24daf7d4566064ee7f5f111 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 10 true
npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/sample/snapshot.json scripts/shutdown/data/test/roots.json true scripts/shutdown/test-scenarios/005-multiple-ctokens.json
npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/sample/rates.json scripts/shutdown/data/test/roots.json
cp scripts/shutdown/test-scenarios/005-multiple-ctokens.json ../rari-hack-repayment/src/data/hackRepaymentSnapshot.json
