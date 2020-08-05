import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import * as Transactions from "@arkecosystem/core-transactions";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource, TransactionWithBlockResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.WalletSearchService)
    private readonly walletSearchService!: Contracts.State.WalletSearchService;

    @Container.inject(Transactions.Identifiers.HtlcLockSearchService)
    private readonly htlcLockSearchService!: Transactions.HtlcLockSearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<Contracts.State.Wallet> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Contracts.State.WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public top(request: Hapi.Request): Contracts.Search.Page<Contracts.State.Wallet> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Contracts.State.WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<Contracts.State.Wallet> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as Contracts.State.WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: Contracts.State.Wallet } | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        return { data: wallet };
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const criteria: Contracts.Shared.TransactionCriteria = { ...request.query, address: wallet.address };
        const order: Contracts.Search.ListOrder = this.getListingOrder(request);
        const page: Contracts.Search.ListPage = this.getListingPage(request);
        const options: Contracts.Search.ListOptions = this.getListingOptions();

        if (request.query.transform) {
            const transactionListResult = await this.transactionHistoryService.listByCriteriaJoinBlock(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionWithBlockResource, true);
        } else {
            const transactionListResult = await this.transactionHistoryService.listByCriteria(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionResource, false);
        }
    }

    public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }
        if (!wallet.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const criteria: Contracts.Shared.TransactionCriteria = { ...request.query, senderPublicKey: wallet.publicKey };
        const order: Contracts.Search.ListOrder = this.getListingOrder(request);
        const page: Contracts.Search.ListPage = this.getListingPage(request);
        const options: Contracts.Search.ListOptions = this.getListingOptions();

        if (request.query.transform) {
            const transactionListResult = await this.transactionHistoryService.listByCriteriaJoinBlock(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionWithBlockResource, true);
        } else {
            const transactionListResult = await this.transactionHistoryService.listByCriteria(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionResource, false);
        }
    }

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const criteria: Contracts.Shared.TransactionCriteria = { ...request.query, recipientId: wallet.address };
        const order: Contracts.Search.ListOrder = this.getListingOrder(request);
        const page: Contracts.Search.ListPage = this.getListingPage(request);
        const options: Contracts.Search.ListOptions = this.getListingOptions();

        if (request.query.transform) {
            const transactionListResult = await this.transactionHistoryService.listByCriteriaJoinBlock(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionWithBlockResource, true);
        } else {
            const transactionListResult = await this.transactionHistoryService.listByCriteria(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionResource, false);
        }
    }

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }
        if (!wallet.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const criteria: Contracts.Shared.TransactionCriteria = {
            ...request.query,
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            senderPublicKey: wallet.publicKey,
        };
        const order: Contracts.Search.ListOrder = this.getListingOrder(request);
        const page: Contracts.Search.ListPage = this.getListingPage(request);
        const options: Contracts.Search.ListOptions = this.getListingOptions();

        if (request.query.transform) {
            const transactionListResult = await this.transactionHistoryService.listByCriteriaJoinBlock(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionWithBlockResource, true);
        } else {
            const transactionListResult = await this.transactionHistoryService.listByCriteria(
                criteria,
                order,
                page,
                options,
            );

            return this.toPagination(transactionListResult, TransactionResource, false);
        }
    }

    public locks(request: Hapi.Request): Contracts.Search.Page<Transactions.HtlcLock> | Boom {
        const walletId = request.params.id as string;
        const wallet = this.walletSearchService.getWallet(walletId);

        if (!wallet) {
            return notFound("Wallet not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Transactions.HtlcLockCriteria;

        return this.htlcLockSearchService.getWalletLocksPage(pagination, ordering, walletId, criteria);
    }
}
