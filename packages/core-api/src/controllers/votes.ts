import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    private readonly databaseTransactionService!: Contracts.Database.TransactionService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const searchResult: Contracts.Database.SearchResult<Interfaces.ITransactionData> = await this.databaseTransactionService.search(
            { ...request.query, typeGroup: Enums.TransactionTypeGroup.Core, type: Enums.TransactionType.Vote },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(searchResult, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const searchResult: Contracts.Database.SearchResult<Interfaces.ITransactionData> = await this.databaseTransactionService.search(
            {
                id: request.params.id,
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Vote,
            },
        );

        if (searchResult.count !== 1) {
            return Boom.notFound("Vote not found");
        }

        return this.respondWithResource(
            searchResult.rows[0],
            TransactionResource,
            (request.query.transform as unknown) as boolean,
        );
    }
}
