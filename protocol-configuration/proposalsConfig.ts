import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

import phase_1 from '@proposals/description/phase_1';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  phase_1: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: phase_1, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '105922348242630140723657180150451860489828983204705055255067506002105519486684',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};
