# reset the fork
npx ts-node scripts/shutdown/resetFork 15488875 true

# give 0xf39 some pool-8-FEI and pool-8-ETH
npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 1000000000000000000 true
npx ts-node scripts/shutdown/setTokenBalance 0xbb025d470162cc5ea24daf7d4566064ee7f5f111 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 20 true

# create merkle trees and deploy redeemer contract
npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/sample/snapshot.json scripts/shutdown/data/test/roots.json true scripts/shutdown/test-scenarios/003-multiple-ctokens.json

redeemerAddress=$(npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/sample/rates.json scripts/shutdown/data/test/roots.json | sed -e 's/[\t ]//g;/^$/d' | grep -Eo '0x[a-fA-F0-9]{40}')
echo "RariMerkleRedeemer deployed at $redeemerAddress"

# give the redeemer some FEI
npx ts-node scripts/shutdown/setTokenBalance 0x956F47F50A910163D8BF957Cf5846D573E7f87CA $redeemerAddress 100000000000000000000 true

# copy the merged snapshot to the rari-hack-repayment repo
cp scripts/shutdown/test-scenarios/003-multiple-ctokens.merged.json ../rari-hack-repayment/src/data/hackRepaymentSnapshot.json
