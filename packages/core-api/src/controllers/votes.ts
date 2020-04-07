import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
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
        const transactions: Contracts.Database.SearchResult<Models.Transaction> = await this.databaseTransactionService.search(
            { ...request.query, typeGroup: Enums.TransactionTypeGroup.Core, type: Enums.TransactionType.Vote },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const transaction: Models.Transaction = await this.databaseTransactionService.searchOne({
                id: request.params.id,
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Vote,
            });

            return this.respondWithResource(
                transaction,
                TransactionResource,
                (request.query.transform as unknown) as boolean,
            );
        } catch (error) {
            if (error instanceof Contracts.Database.NotFoundError) {
                return Boom.notFound("Vote not found");
            }

            throw error;
        }
    }
}
