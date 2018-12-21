import { transactionsRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
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

export function registerMethods(server) {
    const cacheDisabled = !server.app.config.cache.enabled;

    server.method(
        "v1.transactions.index",
        index,
        cacheDisabled
            ? {}
            : {
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
              },
    );

    server.method(
        "v1.transactions.show",
        show,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ id: request.query.id }),
              },
    );
}
