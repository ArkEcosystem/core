import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    LockCriteria,
    LockResource,
    LockResourceProvider,
    LockResourcesPage,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionResourceDbProvider,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Identifiers.TransactionResourceDbProvider)
    private readonly transactionResourceDbProvider!: TransactionResourceDbProvider;

    @Container.inject(Identifiers.LockResourceProvider)
    private readonly lockResourceProvider!: LockResourceProvider;

    public index(request: Hapi.Request): LockResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as LockCriteria;

        return this.lockResourceProvider.getLocksPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): LockResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as LockCriteria;

        return this.lockResourceProvider.getLocksPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): LockResource | Boom {
        const lockId = request.params.id as string;
        const lock = this.lockResourceProvider.getLock(lockId);

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

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, [
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
