import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { BlockResource, BlockWithTransactionsResource } from "../resources";
import { DelegateCriteria, DelegateResource, WalletCriteria, WalletResource } from "../resources-new";
import { DelegateSearchService, WalletSearchService } from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Container.Identifiers.BlockHistoryService)
    private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

    @Container.inject(Identifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    @Container.inject(Identifiers.DelegateSearchService)
    private readonly delegateSearchService!: DelegateSearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<DelegateResource> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as DelegateCriteria;

        return this.delegateSearchService.getDelegatesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<DelegateResource> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as DelegateCriteria;

        return this.delegateSearchService.getDelegatesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: DelegateResource } | Boom {
        const delegateId = request.params.id as string;
        const delegateResource = this.delegateSearchService.getDelegate(delegateId);

        if (!delegateResource) {
            return notFound("Delegate not found");
        }

        return { data: delegateResource };
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegateId = request.params.id as string;
        const delegateResource = this.delegateSearchService.getDelegate(delegateId);

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

    public voters(request: Hapi.Request): Contracts.Search.Page<WalletResource> | Boom {
        const delegateId = request.params.id as string;
        const delegateResource = this.delegateSearchService.getDelegate(delegateId);

        if (!delegateResource) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as WalletCriteria;

        return this.walletSearchService.getActiveWalletsPage(pagination, ordering, criteria, {
            attributes: {
                vote: delegateResource.publicKey,
            },
        });
    }
}
