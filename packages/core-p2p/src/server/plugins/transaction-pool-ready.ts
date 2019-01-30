import { app, Contracts } from "@arkecosystem/core-kernel";
import Boom from "boom";

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
    server.ext({
        type: "onRequest",
        async method(request, h) {
            if (!options.routes.includes(request.path)) {
                return h.continue;
            }

            if (!app.resolve<Contracts.TransactionPool.ITransactionPool>("transactionPool")) {
                return Boom.serverUnavailable("Transaction Pool not ready");
            }

            return h.continue;
        },
    });
};

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
export const plugin = {
    name: "transaction-pool-ready",
    version: "0.1.0",
    register,
};
