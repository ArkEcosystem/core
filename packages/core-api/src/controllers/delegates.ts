import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";
import * as Transactions from "@arkecosystem/core-transactions";

import { BlockResource, BlockWithTransactionsResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Container.Identifiers.BlockHistoryService)
    private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

    @Container.inject(Container.Identifiers.WalletSearchService)
    private readonly walletSearchService!: Contracts.State.WalletSearchService;

    @Container.inject(Transactions.Identifiers.DelegateSearchService)
    private readonly delegateSearchService!: Transactions.DelegateSearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<Transactions.Delegate> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Transactions.DelegateCriteria;

        return this.delegateSearchService.getDelegatesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<Transactions.Delegate> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload;

        return this.delegateSearchService.getDelegatesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: Transactions.Delegate } | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.delegateSearchService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        return { data: delegate };
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegateId = request.params.id as string;
        const delegate = this.delegateSearchService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        if (request.query.transform) {
            const blockCriteria = { generatorPublicKey: delegate.publicKey };
            const blockWithSomeTransactionsListResult = await this.blockHistoryService.listByCriteriaJoinTransactions(
                blockCriteria,
                { typeGroup: Enums.TransactionTypeGroup.Core, type: Enums.TransactionType.MultiPayment },
                this.getListingOrder(request),
                this.getListingPage(request),
                this.getListingOptions(),
            );

            return this.toPagination(blockWithSomeTransactionsListResult, BlockWithTransactionsResource, true);
        } else {
            const blockCriteria = { generatorPublicKey: delegate.publicKey };
            const blockListResult = await this.blockHistoryService.listByCriteria(
                blockCriteria,
                this.getListingOrder(request),
                this.getListingPage(request),
                this.getListingOptions(),
            );

            return this.toPagination(blockListResult, BlockResource, false);
        }
    }

    public voters(request: Hapi.Request): Contracts.Search.Page<Contracts.State.Wallet> | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.delegateSearchService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Contracts.State.WalletCriteria;

        return this.walletSearchService.getActiveWalletsPage(pagination, ordering, criteria, {
            attributes: {
                vote: delegate.publicKey,
            },
        });
    }
}
