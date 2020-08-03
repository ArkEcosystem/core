import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    SomeTransactionResource,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionService,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Identifiers.TransactionService)
    private readonly transactionService!: TransactionService;

    public async index(request: Hapi.Request): Promise<SomeTransactionResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteria;

        return this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        });
    }

    public async show(request: Hapi.Request): Promise<SomeTransactionResource | Boom> {
        const transaction = await this.transactionService.getTransaction(request.query.transform, request.params.id, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        });

        if (!transaction) {
            return notFound("Vote not found");
        }

        return transaction;
    }
}
