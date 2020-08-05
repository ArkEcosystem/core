import { Container, Contracts } from "@arkecosystem/core-kernel";
import * as Transactions from "@arkecosystem/core-transactions";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Transactions.Identifiers.HtlcLockSearchService)
    private readonly htlcLockSearchService!: Transactions.HtlcLockSearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<Transactions.HtlcLock> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as Transactions.HtlcLockCriteria;

        return this.htlcLockSearchService.getLocksPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<Transactions.HtlcLock> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as Transactions.HtlcLockCriteria;

        return this.htlcLockSearchService.getLocksPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: Transactions.HtlcLock } | Boom {
        const lockId = request.params.id as string;
        const lock = this.htlcLockSearchService.getLock(lockId);

        if (!lock) {
            return notFound("Lock not found");
        }

        return { data: lock };
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
