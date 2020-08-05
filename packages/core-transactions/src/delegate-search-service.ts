import { Container, Contracts, Utils as AppUtils, Utils } from "@arkecosystem/core-kernel";
import { DelegateCriteria, Delegate, DelegateLastBlock } from "./interfaces";

@Container.injectable()
export class DelegateSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.WalletSearchService)
    private readonly walletSearchService!: Contracts.State.WalletSearchService;

    public getDelegate(delegateId: string, ...criterias: DelegateCriteria[]): Delegate | undefined {
        const wallet = this.walletSearchService.getWallet(delegateId, { attributes: { delegate: {} } });

        if (!wallet) {
            return undefined;
        }

        const delegate = this.getDelegateResource(wallet);

        if (!AppUtils.Search.testStandardCriterias(delegate, ...criterias)) {
            return undefined;
        }

        return delegate;
    }

    public getDelegatesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: DelegateCriteria[]
    ): Contracts.Search.Page<Delegate> {
        return AppUtils.Search.getPage(pagination, ordering, this.getDelegates(...criterias));
    }

    private *getDelegates(...criterias: DelegateCriteria[]): Iterable<Delegate> {
        for (const wallet of this.walletRepository.allByUsername()) {
            const delegate = this.getDelegateResource(wallet);

            if (AppUtils.Search.testStandardCriterias(delegate, ...criterias)) {
                yield delegate;
            }
        }
    }

    private getDelegateResource(wallet: Contracts.State.Wallet): Delegate {
        AppUtils.assert.defined<string>(wallet.publicKey);

        let delegateLastBlock: DelegateLastBlock | undefined;

        if (wallet.hasAttribute("delegate.lastBlock")) {
            delegateLastBlock = {
                id: wallet.getAttribute<string>("delegate.lastBlock.id"),
                height: wallet.getAttribute<number>("delegate.lastBlock.height"),
                timestamp: wallet.getAttribute<number>("delegate.lastBlock.timestamp"),
            };
        }

        return {
            username: wallet.getAttribute<string>("delegate.username"),
            address: wallet.address,
            publicKey: wallet.publicKey,
            votes: wallet.getAttribute<Utils.BigNumber>("delegate.voteBalance"),
            rank: wallet.getAttribute<number>("delegate.rank"),
            isResigned: wallet.getAttribute<boolean>("delegate.resigned", false),
            blocks: {
                produced: wallet.getAttribute<number>("delegate.producedBlocks"),
                last: delegateLastBlock,
            },
            production: {
                approval: AppUtils.delegateCalculator.calculateApproval(wallet),
            },
            forged: {
                fees: wallet.getAttribute<Utils.BigNumber>("delegate.forgedFees"),
                rewards: wallet.getAttribute<Utils.BigNumber>("delegate.forgedRewards"),
                total: Utils.BigNumber.make(AppUtils.delegateCalculator.calculateForgedTotal(wallet)),
            },
        };
    }
}
