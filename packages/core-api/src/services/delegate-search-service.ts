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
        const delegateResource = this.getDelegateResourceFromWallet(wallet);

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

    public getDelegateResourceFromWallet(wallet: Contracts.State.Wallet): DelegateResource {
        AppUtils.assert.defined<string>(wallet.publicKey);

        // to ensure that every property exists it would be better to getAttribute each of them
        // requires whitelisting all of them in wallet attributes
        const walletDelegate = wallet.getAttribute("delegate");

        let delegateLastBlock: DelegateResourceLastBlock | undefined;

        if (walletDelegate.lastBlock) {
            delegateLastBlock = {
                id: walletDelegate.lastBlock.id,
                height: walletDelegate.lastBlock.height,
                timestamp: walletDelegate.lastBlock.timestamp,
            };
        }

        return {
            username: walletDelegate.username,
            address: wallet.address,
            publicKey: wallet.publicKey,
            votes: walletDelegate.voteBalance,
            rank: walletDelegate.rank,
            isResigned: !!walletDelegate.resigned,
            blocks: {
                produced: walletDelegate.producedBlocks,
                last: delegateLastBlock,
            },
            production: {
                approval: AppUtils.delegateCalculator.calculateApproval(wallet),
            },
            forged: {
                fees: walletDelegate.forgedFees,
                rewards: walletDelegate.forgedRewards,
                total: walletDelegate.forgedFees.plus(walletDelegate.forgedRewards),
            },
        };
    }

    private *getDelegates(...criterias: DelegateCriteria[]): Iterable<DelegateResource> {
        for (const wallet of this.walletRepository.allByUsername()) {
            const delegateResource = this.getDelegateResourceFromWallet(wallet);

            if (AppUtils.Search.testStandardCriterias(delegateResource, ...criterias)) {
                yield delegateResource;
            }
        }
    }
}
