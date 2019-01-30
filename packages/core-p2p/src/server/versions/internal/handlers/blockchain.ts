import { app } from "@arkecosystem/core-kernel";

/**
 * @type {Object}
 */
export const sync = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        app.logger.debug("Blockchain sync check WAKEUP requested by forger :bed:");

        app.blockchain.forceWakeup();

        return h.response(null).code(204);
    },
};
