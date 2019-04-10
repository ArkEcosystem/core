import * as handlers from "./handlers";
/**
 * Register v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
    server.route([
        { method: "GET", path: "/", ...handlers.config },
        { method: "GET", path: "/network", ...handlers.network },
        { method: "GET", path: "/exceptions", ...handlers.exceptions },
        { method: "GET", path: "/milestones", ...handlers.milestones },
        { method: "GET", path: "/genesis-block", ...handlers.genesisBlock },
        { method: "GET", path: "/peers", ...handlers.peers },
        { method: "GET", path: "/delegates", ...handlers.delegates },
    ]);
};

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
export const plugin = {
    name: "ARK P2P - Config API",
    version: "0.1.0",
    register,
};
