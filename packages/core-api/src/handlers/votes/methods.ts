import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Enums } from "@arkecosystem/crypto";
import Boom from "boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const { TransactionTypes } = Enums;

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const transactionsRepository = databaseService.transactionsBusinessRepository;

const index = async request => {
    const transactions = await transactionsRepository.findAllByType(TransactionTypes.Vote, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(transactions, "transaction");
};

const show = async request => {
    const transaction = await transactionsRepository.findByTypeAndId(TransactionTypes.Vote, request.params.id);

    if (!transaction) {
        return Boom.notFound("Vote not found");
    }

    return respondWithResource(transaction, "transaction");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.votes.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.votes.show", show, 8, request => ({ id: request.params.id }));
};
