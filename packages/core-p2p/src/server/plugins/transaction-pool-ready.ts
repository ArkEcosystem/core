import { app } from "@arkecosystem/core-container";
import { TransactionPool } from "@arkecosystem/core-interfaces";
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

            if (!app.resolvePlugin<TransactionPool.IConnection>("transaction-pool")) {
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
