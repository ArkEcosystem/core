import { app } from "@arkecosystem/core-kernel";
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
        /* TODO: Where is this 'events' property coming from? I don't see it set anywhere in core-blockchain.
         Leave untyped until I figure out what the proper implementation should be.
         */
        const event = app.resolve("blockchain").events[request.params.event];

        request.query.param ? event(request.query.params) : event();

        return h.response(null).code(204);
    },
    options: {
        validate: schema.emitEvent,
    },
};
