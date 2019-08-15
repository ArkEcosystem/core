import { app } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

export const transactionPayload = {
    name: "transaction-payload",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onPostAuth",
            async method(request, h) {
                const route = options.routes.find(item => item.path === request.path);

                if (!route) {
                    return h.continue;
                }

                if (route.method.toLowerCase() !== request.method.toLowerCase()) {
                    return h.continue;
                }

                const transactionPool = app.resolveOptions("transaction-pool");

                if (!transactionPool) {
                    return h.continue;
                }

                // NOTE: this will only trigger if the JSON content-type header is not
                // present. This will be avoided by the "content-type.js" plugin in the
                // future which is currently disabled due to v1 still being on mainnet.
                if (!request.payload.transactions) {
                    return Boom.badRequest();
                }

                const transactionsCount = request.payload.transactions.length;
                const maxTransactionsPerRequest = transactionPool.maxTransactionsPerRequest;

                if (transactionsCount > maxTransactionsPerRequest) {
                    return Boom.entityTooLarge(
                        `Received ${transactionsCount} transactions. Only ${maxTransactionsPerRequest} are allowed per request.`,
                        {
                            allowed: maxTransactionsPerRequest,
                            received: transactionsCount,
                        },
                    );
                }

                return h.continue;
            },
        });
    },
};
