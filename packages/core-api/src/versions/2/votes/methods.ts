import { constants } from "@arkecosystem/crypto";
import Boom from "boom";
import { transactionsRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWithResource, toPagination } from "../utils";

const { TRANSACTION_TYPES } = constants;

const index = async request => {
    const transactions = await transactionsRepository.findAllByType(TRANSACTION_TYPES.VOTE, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, transactions, "transaction");
};

const show = async request => {
    const transaction = await transactionsRepository.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id);

    if (!transaction) {
        return Boom.notFound("Vote not found");
    }

    return respondWithResource(request, transaction, "transaction");
};

export function registerMethods(server) {
    server.method("v2.votes.index", index, {
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

    server.method("v2.votes.show", show, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request => generateCacheKey({ id: request.params.id }),
    });
}
