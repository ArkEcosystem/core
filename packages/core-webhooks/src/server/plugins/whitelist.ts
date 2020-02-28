import { Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

export const whitelist = {
    name: "whitelist",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                if (!options.whitelist) {
                    return h.continue;
                }

                if (Utils.isWhitelisted(options.whitelist, request.info.remoteAddress)) {
                    return h.continue;
                }

                return Boom.forbidden();
            },
        });
    },
};
