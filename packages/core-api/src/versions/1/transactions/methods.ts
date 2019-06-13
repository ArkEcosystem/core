import { transactionsRepository } from "../../../repositories";
import { ServerCache } from "../../../services";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const index = async request => {
    const { count, rows } = await transactionsRepository.findAllLegacy({
        ...request.query,
        ...paginate(request),
    });

    if (!rows) {
        return respondWith("No transactions found", true);
    }

    return respondWith({
        transactions: toCollection(request, rows, "transaction"),
        count,
    });
};

const show = async request => {
    const result = await transactionsRepository.findById(request.query.id);

    if (!result) {
        return respondWith("No transactions found", true);
    }

    return respondWith({
        transaction: toResource(request, result, "transaction"),
    });
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v1.transactions.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v1.transactions.show", show, 8, request => ({ id: request.query.id }));
};
