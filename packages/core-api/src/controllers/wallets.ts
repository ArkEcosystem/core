import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { TransactionResource, TransactionWithBlockResource } from "../resources";
import {
    LockCriteria,
    lockCriteriaSchemaObject,
    LockResource,
    WalletCriteria,
    walletCriteriaSchemaObject,
    WalletResource,
} from "../resources-new";
import { LockSearchService, WalletSearchService } from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Identifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    @Container.inject(Identifiers.LockSearchService)
    private readonly lockSearchService!: LockSearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<WalletResource> {
        const pagination = this.getQueryPagination(request.query);
        const ordering = request.query.orderBy as Contracts.Search.Ordering;
        const criteria = this.getQueryCriteria(request.query, walletCriteriaSchemaObject) as WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public top(request: Hapi.Request): Contracts.Search.Page<WalletResource> {
        const pagination = this.getQueryPagination(request.query);
        const ordering = request.query.orderBy as Contracts.Search.Ordering;
        const criteria = this.getQueryCriteria(request.query, walletCriteriaSchemaObject) as WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<WalletResource> {
        const pagination = this.getQueryPagination(request.query);
        const ordering = request.query.orderBy as Contracts.Search.Ordering;
        const criteria = request.payload as WalletCriteria;

        return this.walletSearchService.getWalletsPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: WalletResource } | Boom {
        const walletId = request.params.id as string;
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }

        return { data: walletResource };
    }

    public locks(request: Hapi.Request): Contracts.Search.Page<LockResource> | Boom {
        const walletId = request.params.id as string;
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const pagination = this.getQueryPagination(request.query);
        const ordering = request.query.orderBy as Contracts.Search.Ordering;
        const criteria = this.getQueryCriteria(request.query, lockCriteriaSchemaObject) as LockCriteria;

        return this.lockSearchService.getWalletLocksPage(pagination, ordering, walletId, criteria);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const criteria: Contracts.Shared.TransactionCriteria = { ...request.query, address: walletResource.address };
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
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }
        if (!walletResource.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const criteria: Contracts.Shared.TransactionCriteria = {
            ...request.query,
            senderPublicKey: walletResource.publicKey,
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

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const criteria: Contracts.Shared.TransactionCriteria = {
            ...request.query,
            recipientId: walletResource.address,
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

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;
        const walletResource = this.walletSearchService.getWallet(walletId);

        if (!walletResource) {
            return notFound("Wallet not found");
        }
        if (!walletResource.publicKey) {
            return AppUtils.Search.getEmptyPage();
        }

        const criteria: Contracts.Shared.TransactionCriteria = {
            ...request.query,
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            senderPublicKey: walletResource.publicKey,
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
}
