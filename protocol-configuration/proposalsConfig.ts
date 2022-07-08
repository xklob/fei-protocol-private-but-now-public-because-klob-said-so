import { ProposalCategory, TemplatedProposalDescription, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

import tip_118 from '@proposals/description/tip_118';
import ido_liquidity_removal from '@proposals/description/ido_liquidity_removal';

const proposals: TemplatedProposalsConfigMap = {
  tip_118: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_118, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '51231121834530012753681738151468680610244577003051886904108651382822073179752',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG
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

export default proposals;
