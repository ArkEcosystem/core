import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    LockCriteria,
    LockResourceProvider,
    LockResourcesPage,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionCriteriaItem,
    TransactionResourceDbProvider,
    WalletCriteria,
    WalletResourceProvider,
    WalletResourcesPage,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Identifiers.WalletResourceProvider)
    private readonly transactionResourceDbProvider!: TransactionResourceDbProvider;

    @Container.inject(Identifiers.WalletResourceProvider)
    private readonly walletResourceProvider!: WalletResourceProvider;

    @Container.inject(Identifiers.LockResourceProvider)
    private readonly lockResourceProvider!: LockResourceProvider;

    public index(request: Hapi.Request): WalletResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as WalletCriteria;

        return this.walletResourceProvider.getWalletsPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): WalletResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as WalletCriteria;

        return this.walletResourceProvider.getWalletsPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): Contracts.State.Wallet | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        return wallet;
    }

    public async transactions(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteriaItem;

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, {
            address: wallet.address,
        });
    }

    public async transactionsSent(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        if (!wallet.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteriaItem;

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, {
            senderPublicKey: wallet.publicKey,
        });
    }

    public async transactionsReceived(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteria;

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, {
            recipientId: wallet.address,
        });
    }

    public locks(request: Hapi.Request): LockResourcesPage | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as LockCriteria;

        return this.lockResourceProvider.getWalletLocksPage(pagination, ordering, walletId, criteria);
    }

    public async votes(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletResourceProvider.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        if (!wallet.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteriaItem;

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            senderPublicKey: wallet.publicKey,
        });
    }
}
