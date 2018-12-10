import Boom from "boom";
import { transactionsRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWithResource, toPagination } from "../utils";

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
    server.method("v2.transactions.index", index, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request =>
            generateCacheKey({
                ...request.query,
                ...paginate(request),
            }),
    });

    server.method("v2.transactions.show", show, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request => generateCacheKey({ id: request.params.id }),
    });

    server.method("v2.transactions.search", search, {
        cache: {
            expiresIn: 30 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request =>
            generateCacheKey({
                ...request.payload,
                ...request.query,
                ...paginate(request),
            }),
    });
}
