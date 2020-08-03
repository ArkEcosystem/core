import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    HtlcLockCriteria,
    HtlcLockService,
    HtlcLocksPage,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionCriteriaItem,
    TransactionService,
    WalletCriteria,
    WalletService,
    WalletsPage,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Identifiers.WalletService)
    private readonly walletService!: WalletService;

    @Container.inject(Identifiers.WalletService)
    private readonly transactionService!: TransactionService;

    @Container.inject(Identifiers.HtlcLockService)
    private readonly htlcLockService!: HtlcLockService;

    public index(request: Hapi.Request): WalletsPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as WalletCriteria;

        return this.walletService.getWalletsPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): WalletsPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as WalletCriteria;

        return this.walletService.getWalletsPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): Contracts.State.Wallet | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        return wallet;
    }

    public async transactions(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteriaItem;

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, {
            address: wallet.address,
        });
    }

    public async transactionsSent(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

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

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, {
            senderPublicKey: wallet.publicKey,
        });
    }

    public async transactionsReceived(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteria;

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, {
            recipientId: wallet.address,
        });
    }

    public locks(request: Hapi.Request): HtlcLocksPage | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as HtlcLockCriteria;

        return this.htlcLockService.getWalletLocksPage(pagination, ordering, walletId, criteria);
    }

    public async votes(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const walletId = request.params.id as string;
        const wallet = this.walletService.getWallet(walletId);

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

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            senderPublicKey: wallet.publicKey,
        });
    }
}
