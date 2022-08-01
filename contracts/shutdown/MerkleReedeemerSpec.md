# Merkle Redeemer Spec

## Governance Flow
 - Deploy contract
 - Configure base token
 - Configure cToken exchange rates
 - Configure merkle roots

## User Flow
 - Go to website; UI prompts to connect wallet
 - Once wallet connected, the website will display two primary things:
    - Whether or not the user has any tokens to claim
    - Whether or not the user has signed the message
 - Website will allow the user to sign the message and claim their tokens, prompting for approvals for the ctokens first
 - The user can claim a configurable amount of each ctoken, or all of them (if possible)

 ## Frontend
 - Frontend will hold the merkle tree data and fetch the correct data for the user that signs in, so that they can provide it in their merkle proof
 - Frontend will know all users that have a claim. If the supplied user has a claim, it will call into the contract to see if the user has signed their message (`userSignatures`)
 - If the user has signed their message, then it qeuries `redeemableTokensRemaining` for each cToken to get the user's redeemable amounts remaining, using `previewRedeem` to calculate the amount of the base token they'd get for eeach cToken.