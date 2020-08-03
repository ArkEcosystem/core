import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    HtlcLock,
    HtlcLockCriteria,
    HtlcLockService,
    HtlcLocksPage,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionService,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Identifiers.HtlcLockService)
    private readonly htlcService!: HtlcLockService;

    @Container.inject(Identifiers.TransactionService)
    private readonly transactionService!: TransactionService;

    public index(request: Hapi.Request): HtlcLocksPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as HtlcLockCriteria;

        return this.htlcService.getLocksPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): HtlcLocksPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as HtlcLockCriteria;

        return this.htlcService.getLocksPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): HtlcLock | Boom {
        const lock = this.htlcService.getLock(request.params.id);
        if (!lock) {
            return notFound("Lock not found");
        }

        return lock;
    }

    public async unlocked(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteria;
        const lockIds = request.payload.ids as string[];

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, [
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcClaim,
                asset: lockIds.map((lockId) => ({ claim: { lockTransactionId: lockId } })),
            },
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcRefund,
                asset: lockIds.map((lockId) => ({ refund: { lockTransactionId: lockId } })),
            },
        ]);
    }
}
