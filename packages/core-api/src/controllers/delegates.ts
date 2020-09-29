import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { BlockResource, BlockWithTransactionsResource } from "../resources";
import {
    DelegateCriteria,
    delegateCriteriaSchemaObject,
    DelegateResource,
    WalletCriteria,
    walletCriteriaSchemaObject,
    WalletResource,
} from "../resources-new";
import { DelegateSearchService, WalletSearchService } from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Identifiers.DelegateSearchService)
    private readonly delegateSearchService!: DelegateSearchService;

    @Container.inject(Identifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    @Container.inject(Container.Identifiers.BlockHistoryService)
    private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

    public index(request: Hapi.Request): Contracts.Search.ResultsPage<DelegateResource> {
        const pagination = this.getQueryPagination(request.query);
        const sorting = request.query.orderBy as Contracts.Search.Sorting;
        const criteria = this.getQueryCriteria(request.query, delegateCriteriaSchemaObject) as DelegateCriteria;

        return this.delegateSearchService.getDelegatesPage(pagination, sorting, criteria);
    }

    public show(request: Hapi.Request): { data: DelegateResource } | Boom {
        const walletId = request.params.id as string;

        const walletResource = this.walletSearchService.getWallet(walletId);
        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const delegateResource = this.delegateSearchService.getDelegate(walletResource.address);
        if (!delegateResource) {
            return notFound("Delegate not found");
        }

        return { data: delegateResource };
    }

    public voters(request: Hapi.Request): Contracts.Search.ResultsPage<WalletResource> | Boom {
        const walletId = request.params.id as string;

        const walletResource = this.walletSearchService.getWallet(walletId);
        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const delegateResource = this.delegateSearchService.getDelegate(walletResource.address);
        if (!delegateResource) {
            return notFound("Delegate not found");
        }

        const pagination = this.getQueryPagination(request.query);
        const sorting = request.query.orderBy as Contracts.Search.Sorting;
        const criteria = this.getQueryCriteria(request.query, walletCriteriaSchemaObject) as WalletCriteria;

        return this.walletSearchService.getActiveWalletsPage(pagination, sorting, criteria, {
            attributes: {
                vote: delegateResource.publicKey,
            },
        });
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const walletId = request.params.id as string;

        const walletResource = this.walletSearchService.getWallet(walletId);
        if (!walletResource) {
            return notFound("Wallet not found");
        }

        const delegateResource = this.delegateSearchService.getDelegate(walletResource.address);
        if (!delegateResource) {
            return notFound("Delegate not found");
        }

        if (request.query.transform) {
            const blockCriteria = { generatorPublicKey: delegateResource.publicKey };
            const blockWithSomeTransactionsListResult = await this.blockHistoryService.listByCriteriaJoinTransactions(
                blockCriteria,
                { typeGroup: Enums.TransactionTypeGroup.Core, type: Enums.TransactionType.MultiPayment },
                this.getListingOrder(request),
                this.getListingPage(request),
                this.getListingOptions(),
            );

            return this.toPagination(blockWithSomeTransactionsListResult, BlockWithTransactionsResource, true);
        } else {
            const blockCriteria = { generatorPublicKey: delegateResource.publicKey };
            const blockListResult = await this.blockHistoryService.listByCriteria(
                blockCriteria,
                this.getListingOrder(request),
                this.getListingPage(request),
                this.getListingOptions(),
            );

            return this.toPagination(blockListResult, BlockResource, false);
        }
    }
}
