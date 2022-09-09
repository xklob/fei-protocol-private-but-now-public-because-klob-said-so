// This config lists all of the contracts that should be in the collateralization oracle
// Key names are the tokens that the contract holds / should be tracked in
// Values are arrays of contracts that hold that token

export const CollateralizationOracleConfig = {
  fei: [
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariTimelockFeiOldLens',
    'tribalCouncilTimelockFeiLens'
  ],
  lusd: ['lusdToDaiLensLusd'],
  dai: ['simpleFeiDaiPSM', 'ethToDaiLensDai', 'daiHoldingPCVDeposit', 'lusdToDaiLensDai'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  fei: ['rariPool79FeiPCVDepositWrapper', 'rariTimelockFeiOldLens'],
  dai: ['daiFixedPricePSM', 'daiHoldingPCVDeposit', 'ethToDaiLensDai'],
  lusd: ['lusdHoldingPCVDeposit'],
  weth: ['ethLidoPCVDeposit', 'balancerLensVeBalWeth', 'ethToDaiLensEth', 'wethHoldingPCVDeposit']
};

export type CollateralizationOracleConfigType = typeof CollateralizationOracleConfig;
