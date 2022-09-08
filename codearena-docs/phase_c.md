# Phase-C
The goal of Phase-C is to turn FEI and TRIBE into redemption receipts for underlying PCV. 
The relevant contracts are:
- `SimpleFeiDaiPSM.sol`
- `TribeRedeemer.sol`

## SimpleFeiDaiPSM.sol
This is a permanent, governancless peg stability module which provides 1:1 redeemability between FEI and DAI. 

There are two key state changing functions:
- `mint(address to, uint256 amountIn, uint256 amountOut)`: take in DAI, mint an equivalent amount of FEI
- `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`: take in FEI, and return an equivalent amount of DAI

In addition, the contract can also act as a FEI sink and burn any FEI that accumulates on it through a permissionless call to `burnFeiHeld()`.

## TribeRedeemer.sol
This allows TRIBE to be redeemed for a list of underlying tokens. The contract will hold various assets defined in the list `address[] tokensReceived()` and it will allow TRIBE to be exchanged for a pro-rata basket of those `tokensReceived()`.

There is one key state changing function, `redeem(address to, uint256 amountIn)` which will transfer a user's TRIBE to the contract and return a pro-rata share of the `tokensReceived` in return. 
