import { app } from "@arkecosystem/core-container";
import requestIp from "request-ip";
import * as schema from "../schemas/blocks";

/**
 * @type {Object}
 */
export const store = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler: (request, h) => {
        request.payload.block.ip = requestIp.getClientIp(request);

        app.resolvePlugin("blockchain").queueBlock(request.payload.block);

        return h.response(null).code(204);
    },
    options: {
        validate: schema.store,
    },
};
