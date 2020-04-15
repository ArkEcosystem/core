import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class VotesController extends Controller {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const criteria = {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        };
        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            this.getListingPage(request),
            this.getListingOrder(request),
            request.query,
            criteria,
        );

        return this.toPagination(transactionListResult, TransactionResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction = await this.transactionHistoryService.findOneByCriteria({
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            id: request.params.id,
        });
        if (!transaction) {
            return Boom.notFound("Vote not found");
        }

        return this.respondWithResource(transaction, TransactionResource, request.query.transform);
    }
}
