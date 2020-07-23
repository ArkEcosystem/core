import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { LockResource, TransactionResource, TransactionWithBlockResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const criteria = this.getListingCriteria(request);
        const order = this.getListingOrder(request);
        const page = this.getListingPage(request);
        const wallets = this.walletRepository.listByCriteria(criteria, order, page);

        return this.toPagination(wallets, WalletResource);
    }

    public async top(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const criteria = {};
        const order: Contracts.Search.ListOrder = [{ property: "balance", direction: "desc" }];
        const page = this.getListingPage(request);
        const wallets = this.walletRepository.listByCriteria(criteria, order, page);

        return this.toPagination(wallets, WalletResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
        if (!wallet) {
            return notFound("Wallet not found");
        }

        return this.respondWithResource(wallet, WalletResource);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
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

    public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
        if (!wallet) {
            return notFound("Wallet not found");
        }
        if (!wallet.publicKey) {
            return this.toPagination({ rows: [], count: 0, countIsEstimate: false }, TransactionResource);
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

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
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

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
        if (!wallet) {
            return notFound("Wallet not found");
        }
        if (!wallet.publicKey) {
            return this.toPagination({ rows: [], count: 0, countIsEstimate: false }, TransactionResource);
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

    public async locks(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const wallet: Contracts.State.Wallet | undefined = this.findWallet(request.params.id);
        if (!wallet) {
            return notFound("Wallet not found");
        }
        if (!wallet.publicKey) {
            return this.toPagination({ rows: [], count: 0, countIsEstimate: false }, LockResource);
        }

        const lockListResult = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            ...request.params,
            ...request.query,
            ...this.getListingPage(request),
            senderPublicKey: wallet.publicKey,
        });

        return this.toPagination(lockListResult, LockResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object> {
        const criteria = request.payload;
        const page = this.getListingPage(request);
        const order = this.getListingOrder(request);
        const wallets = this.walletRepository.listByCriteria(criteria, order, page);

        return this.toPagination(wallets, WalletResource);
    }

    private findWallet(id: string): Contracts.State.Wallet | undefined {
        const addressCriteria = { address: id };
        const publicKeyCriteria = { publicKey: id };
        const delegateUsernameCriteria = { attributes: { delegate: { username: id } } };

        return this.walletRepository.findOneByCriteria([addressCriteria, publicKeyCriteria, delegateUsernameCriteria]);
    }
}
