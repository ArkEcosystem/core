import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const transactionsRepository = app.resolvePlugin<Database.IDatabaseService>("database").transactionsBusinessRepository;

const index = async request => {
    const transactions = await transactionsRepository.findAll({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, transactions, "transaction");
};

const show = async request => {
    const transaction = await transactionsRepository.findById(request.params.id);

    if (!transaction) {
        return Boom.notFound("Transaction not found");
    }

    return respondWithResource(request, transaction, "transaction");
};

const search = async request => {
    const transactions = await transactionsRepository.search({
        ...request.query,
        ...request.payload,
        ...paginate(request),
    });

    return toPagination(request, transactions, "transaction");
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v2.transactions.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.transactions.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.transactions.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
}
