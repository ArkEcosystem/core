import { Container, Contracts, Utils as AppUtils, Utils } from "@arkecosystem/core-kernel";

import { Identifiers } from "../identifiers";
import { WalletSearchService } from "./wallet-search-service";

export type DelegateCriteria = Contracts.Search.StandardCriteriaOf<DelegateResource>;

export type DelegateResource = {
    username: string;
    address: string;
    publicKey: string;
    votes: Utils.BigNumber;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
        last: DelegateResourceLastBlock | undefined;
    };
    production: {
        approval: number;
    };
    forged: {
        fees: Utils.BigNumber;
        rewards: Utils.BigNumber;
        total: Utils.BigNumber;
    };
};

export type DelegateResourceLastBlock = {
    id: string;
    height: number;
    timestamp: number;
};

@Container.injectable()
export class DelegateSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Identifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    public getDelegate(delegateId: string, ...criterias: DelegateCriteria[]): DelegateResource | undefined {
        const walletResource = this.walletSearchService.getWallet(delegateId, { attributes: { delegate: {} } });
        if (!walletResource) {
            return undefined;
        }

        const wallet = this.walletRepository.findByAddress(walletResource.address);
        const delegateResource = this.getDelegateResource(wallet);

        if (AppUtils.Search.testStandardCriterias(delegateResource, ...criterias)) {
            return delegateResource;
        } else {
            return undefined;
        }
    }

    public getDelegatesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: DelegateCriteria[]
    ): Contracts.Search.Page<DelegateResource> {
        ordering = [ordering, "rank:asc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getDelegates(...criterias));
    }

    private *getDelegates(...criterias: DelegateCriteria[]): Iterable<DelegateResource> {
        for (const wallet of this.walletRepository.allByUsername()) {
            const delegateResource = this.getDelegateResource(wallet);

            if (AppUtils.Search.testStandardCriterias(delegateResource, ...criterias)) {
                yield delegateResource;
            }
        }
    }

    private getDelegateResource(wallet: Contracts.State.Wallet): DelegateResource {
        AppUtils.assert.defined<string>(wallet.publicKey);

        let delegateLastBlock: DelegateResourceLastBlock | undefined;

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
