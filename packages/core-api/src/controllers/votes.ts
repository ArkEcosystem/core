import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    private readonly databaseTransactionService!: Contracts.Database.TransactionService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionListResult = await this.databaseTransactionService.listVoteByCriteria(
            request.query,
            this.getListOrder(request),
            this.getListPage(request),
        );

        return this.toPagination(transactionListResult, TransactionResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.databaseTransactionService.findOneById(request.params.id);
        const found =
            transaction &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core &&
            transaction.type === Enums.TransactionType.Vote;

        if (!found) {
            return Boom.notFound("Vote not found");
        }

        return this.respondWithResource(transaction, TransactionResource, request.query.transform);
    }
}
