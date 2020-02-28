import { Models, Repositories } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.searchByQuery(
            { ...request.query, ...{ type: Enums.TransactionType.Vote } },
            this.paginate(request),
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction: Models.Transaction | undefined = await this.transactionRepository.findByIdAndType(
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
