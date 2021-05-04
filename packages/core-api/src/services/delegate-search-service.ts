import { Container, Contracts, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { DelegateCriteria, DelegateResource, DelegateResourceLastBlock } from "../resources-new";

@Container.injectable()
export class DelegateSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StandardCriteriaService)
    private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

    @Container.inject(Container.Identifiers.PaginationService)
    private readonly paginationService!: Services.Search.PaginationService;

    public getDelegate(walletAddress: string): DelegateResource | undefined {
        const wallet = this.walletRepository.findByAddress(walletAddress);

        if (wallet.hasAttribute("delegate")) {
            return this.getDelegateResourceFromWallet(wallet);
        } else {
            return undefined;
        }
    }

    public getDelegatesPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        ...criterias: DelegateCriteria[]
    ): Contracts.Search.ResultsPage<DelegateResource> {
        sorting = [...sorting, { property: "rank", direction: "asc" }];

        return this.paginationService.getPage(pagination, sorting, this.getDelegates(...criterias));
    }

    private getDelegateResourceFromWallet(wallet: Contracts.State.Wallet): DelegateResource {
        AppUtils.assert.defined<string>(wallet.getPublicKey());

        const delegateAttribute = wallet.getAttribute("delegate");

        let delegateLastBlock: DelegateResourceLastBlock | undefined;

        if (delegateAttribute.lastBlock) {
            delegateLastBlock = {
                id: delegateAttribute.lastBlock.id,
                height: delegateAttribute.lastBlock.height,
                timestamp: AppUtils.formatTimestamp(delegateAttribute.lastBlock.timestamp),
            };
        }

        return {
            username: delegateAttribute.username,
            address: wallet.getAddress(),
            publicKey: wallet.getPublicKey()!,
            votes: delegateAttribute.voteBalance,
            rank: delegateAttribute.rank,
            isResigned: !!delegateAttribute.resigned,
            blocks: {
                produced: delegateAttribute.producedBlocks,
                last: delegateLastBlock,
            },
            production: {
                approval: AppUtils.delegateCalculator.calculateApproval(wallet),
            },
            forged: {
                fees: delegateAttribute.forgedFees,
                rewards: delegateAttribute.forgedRewards,
                total: delegateAttribute.forgedFees.plus(delegateAttribute.forgedRewards),
            },
        };
    }

    private *getDelegates(...criterias: DelegateCriteria[]): Iterable<DelegateResource> {
        for (const wallet of this.walletRepository.allByUsername()) {
            const delegateResource = this.getDelegateResourceFromWallet(wallet);

            if (this.standardCriteriaService.testStandardCriterias(delegateResource, ...criterias)) {
                yield delegateResource;
            }
        }
    }
}
