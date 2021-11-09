import { ProposalDescription } from '@custom-types/types';

const fip_41: ProposalDescription = {
  title: 'FIP-41: LUSD Auction',
  commands: [
    {
      target: 'feiLusdLBPSwapper',
      values: '0',
      method: 'setSwapFrequency(uint256)',
      arguments: ['1209600'],
      description: 'Set auction duration to 2 weeks'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiLusdLBPSwapper}', '100000000000000000000000000'],
      description: 'Mint 100M FEI to LBP swapper'
    },
    {
      target: 'feiLusdLBPSwapper',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Trigger the auction start'
    }
  ],
  description: `

Summary:
Acquire 100M LUSD through a Balancer auction and supply to LUSD stability pool. This amount represents 8.5% of Fei PCV and 14% of LUSD total supply.

Proposal:
With Liquity USD pegged stablecoin (LUSD), Fei can earn yield and better protect the $FEI peg.

Lending Stablecoins have scaling challenges as they depend on demand for leverage. However, in a crash scenario, liquidations help them to hold the peg when the market is deleveraging. Lending Stablecoins are a good fit for Reserve Stablecoins like FEI, helping the latter to protect the peg in extreme scenarios.

Liquity is a decentralized borrowing protocol that allows you to draw interest-free loans against ETH used as collateral. Loans are paid out in LUSD and need to maintain a minimum collateral ratio of 110%. In addition to the collateral, the loans are secured by a Stability Pool containing LUSD and by fellow borrowers collectively acting as guarantors of last resort.

LUSD launched in April 2021, the current market cap is $710M and possesses a total collateral ratio of 290%.

Liquity is governance-free and has multiple decentralized front-end interfaces giving it more resilience and censorship resistance. It is very aligned with Fei in relation to decentralization.

Specification:
Acquire 100M LUSD through a Balancer auction using minted FEI. It is a similar process to the one used for TRIBE buybacks.

Forum discussion: https://tribe.fei.money/t/fip-41-acquire-lusd-through-a-balancer-auction/3602
Snapshot: https://snapshot.org/#/fei.eth/proposal/0x0e5f05a0c51938b904d9932849251ae920403b75301f90567da9d1ed857965c3
`
};

export default fip_41;
