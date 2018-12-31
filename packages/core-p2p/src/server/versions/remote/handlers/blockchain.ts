import { app } from "@arkecosystem/core-container";
import * as schema from "../schemas/blockchain";

/**
 * Respond with a blockchain event.
 * @type {Object}
 */
export const emitEvent = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler: (request, h) => {
        // TODO: Blockchain.events object shouldn't be accessed directly. Implement an 'emit' method on Blockchain
        const event = app.resolvePlugin("blockchain").events[request.params.event];

        request.query.param ? event(request.query.params) : event();

        return h.response(null).code(204);
    },
    options: {
        validate: schema.emitEvent,
    },
};
