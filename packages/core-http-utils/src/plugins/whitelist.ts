import { isWhitelisted } from "@arkecosystem/core-utils";
import Boom from "@hapi/boom";

export const whitelist = {
    name: "whitelist",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                if (isWhitelisted(options.whitelist, request.info.remoteAddress)) {
                    return h.continue;
                }

                return Boom.forbidden();
            },
        });
    },
};
