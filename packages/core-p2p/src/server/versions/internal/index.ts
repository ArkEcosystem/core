import * as blockchain from "./handlers/blockchain";
import * as blocks from "./handlers/blocks";
import * as network from "./handlers/network";
import * as rounds from "./handlers/rounds";
import * as transactions from "./handlers/transactions";
import * as utils from "./handlers/utils";

/**
 * Register internal routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
    server.route([
        { method: "GET", path: "/network/state", ...network.state },

        { method: "GET", path: "/blockchain/sync", ...blockchain.sync },

        { method: "POST", path: "/blocks", ...blocks.store },

        { method: "GET", path: "/rounds/current", ...rounds.current },

        { method: "POST", path: "/transactions/verify", ...transactions.verify },
        { method: "GET", path: "/transactions/forging", ...transactions.forging },

        { method: "POST", path: "/utils/events", ...utils.emitEvent },
    ]);
};

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
export const plugin = {
    name: "Ark P2P API - Internal",
    version: "0.1.0",
    register,
};
