import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const transactionsRepository = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
    .transactionsBusinessRepository;

const index = async request => {
    const transactions = await transactionsRepository.search({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(transactions, "transaction", (request.query.transform as unknown) as boolean);
};

const show = async request => {
    const transaction = await transactionsRepository.findById(request.params.id);

    if (!transaction) {
        return Boom.notFound("Transaction not found");
    }

    return respondWithResource(transaction, "transaction", (request.query.transform as unknown) as boolean);
};

const search = async request => {
    const transactions = await transactionsRepository.search({
        ...request.query,
        ...request.payload,
        ...paginate(request),
    });

    return toPagination(transactions, "transaction", (request.query.transform as unknown) as boolean);
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.transactions.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.transactions.show", show, 8, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.transactions.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
