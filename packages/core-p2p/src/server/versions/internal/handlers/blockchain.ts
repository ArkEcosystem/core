import { app } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";

const logger = app.resolvePlugin<AbstractLogger>("logger");

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
        logger.debug("Blockchain sync check WAKEUP requested by forger :bed:");

        app.resolvePlugin("blockchain").forceWakeup();

        return h.response(null).code(204);
    },
};
