import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { DposDelegate, DposDelegateCriteria, DposDelegateLastBlock, DposDelegatesPage } from "./dpos-delegate";
import { WalletService } from "./wallet-service";

@Container.injectable()
export class DposService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Identifiers.WalletService)
    private readonly walletService!: WalletService;

    public getDelegate(delegateId: string, ...criterias: DposDelegateCriteria[]): DposDelegate | undefined {
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

    public *getDelegates(...criterias: DposDelegateCriteria[]): Iterable<DposDelegate> {
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
        ...criterias: DposDelegateCriteria[]
    ): DposDelegatesPage {
        return AppUtils.Search.getPage(pagination, [ordering, "rank:asc"], this.getDelegates(...criterias));
    }

    private getDelegateResource(wallet: Contracts.State.Wallet): DposDelegate {
        AppUtils.assert.defined<string>(wallet.publicKey);

        let delegateLastBlock: DposDelegateLastBlock | undefined;

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
