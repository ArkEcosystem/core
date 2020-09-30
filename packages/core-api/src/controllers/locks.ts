import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { TransactionResource } from "../resources";
import { LockCriteria, lockCriteriaSchemaObject, LockResource } from "../resources-new";
import { LockSearchService } from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Identifiers.LockSearchService)
    private readonly lockSearchService!: LockSearchService;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public index(request: Hapi.Request): Contracts.Search.ResultsPage<LockResource> {
        const pagination = this.getQueryPagination(request.query);
        const sorting = request.query.orderBy as Contracts.Search.Sorting;
        const criteria = this.getQueryCriteria(request.query, lockCriteriaSchemaObject) as LockCriteria;

        return this.lockSearchService.getLocksPage(pagination, sorting, criteria);
    }

    public show(request: Hapi.Request): { data: LockResource } | Boom {
        const lockId = request.params.id as string;

        const lockResource = this.lockSearchService.getLock(lockId);
        if (!lockResource) {
            return notFound("Lock not found");
        }

        return { data: lockResource };
    }

    public async unlocked(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const criteria = [
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcClaim,
                asset: request.payload.ids.map((lockId: string) => ({ claim: { lockTransactionId: lockId } })),
            },
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcRefund,
                asset: request.payload.ids.map((lockId: string) => ({ refund: { lockTransactionId: lockId } })),
            },
        ];

        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
            this.getListingOptions(),
        );

        return this.toPagination(transactionListResult, TransactionResource);
    }
}
