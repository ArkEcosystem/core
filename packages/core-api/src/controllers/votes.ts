import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.databaseService.transactionsBusinessRepository.findAllByType(
            Enums.TransactionType.Vote,
            {
                ...request.query,
                ...this.paginate(request),
            },
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.databaseService.transactionsBusinessRepository.findByTypeAndId(
            Enums.TransactionType.Vote,
            request.params.id,
        );

        if (!transaction) {
            return Boom.notFound("Vote not found");
        }

        return this.respondWithResource(
            transaction,
            TransactionResource,
            (request.query.transform as unknown) as boolean,
        );
    }
}
