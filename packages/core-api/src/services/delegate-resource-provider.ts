import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import {
    DelegateCriteria,
    DelegateResource,
    DelegateResourceLastBlock,
    DelegateResourcesPage,
} from "./delegate-resource";
import { WalletResourceProvider } from "./wallet-resource-provider";

@Container.injectable()
export class DelegateResourceProvider {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Identifiers.WalletResourceProvider)
    private readonly walletService!: WalletResourceProvider;

    public getDelegate(delegateId: string, ...criterias: DelegateCriteria[]): DelegateResource | undefined {
        const walletDelegateCriteria = { attributes: { delegate: {} } };
        const wallet = this.walletService.getWallet(delegateId, walletDelegateCriteria);
        if (!wallet) {
            return undefined;
        }

        const delegate = this.getDelegateResource(wallet);
        if (!AppUtils.Search.testCriterias(delegate, ...criterias)) {
            return undefined;
        }

        return delegate;
    }

    public *getDelegates(...criterias: DelegateCriteria[]): Iterable<DelegateResource> {
        for (const wallet of this.walletRepository.allByUsername()) {
            const delegate = this.getDelegateResource(wallet);

            if (AppUtils.Search.testCriterias(delegate, ...criterias)) {
                yield delegate;
            }
        }
    }

    public getDelegatesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: DelegateCriteria[]
    ): DelegateResourcesPage {
        return AppUtils.Search.getPage(pagination, [ordering, "rank:asc"], this.getDelegates(...criterias));
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
