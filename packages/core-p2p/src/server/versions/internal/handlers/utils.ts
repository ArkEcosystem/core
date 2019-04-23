import { app } from "@arkecosystem/core-container";
import { EventEmitter } from "@arkecosystem/core-interfaces";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

import * as schema from "../schemas/utils";

/**
 * Emit the given event and payload to the local host.
 * @type {Object}
 */
export const emitEvent: object = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler: (request, h) => {
        emitter.emit(request.payload.event, request.payload.body);

        return h.response(null).code(204);
    },
    options: {
        validate: schema.emitEvent,
    },
};
