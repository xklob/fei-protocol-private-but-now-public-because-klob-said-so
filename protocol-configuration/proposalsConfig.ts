import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

import tip_119 from '@proposals/description/tip_119';
import ido_liquidity_removal from '@proposals/description/ido_liquidity_removal';
import rari_infra_clawback from '@proposals/description/rari_infra_clawback';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_119: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_119, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  rari_infra_clawback: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: rari_infra_clawback, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG_TC
  },
  ido_liquidity_removal: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: ido_liquidity_removal, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG
  }
};
