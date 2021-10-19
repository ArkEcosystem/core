import { Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { getIp } from "../utils";

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

                if (Utils.isWhitelisted(options.whitelist, getIp(request, options.trustProxy))) {
                    return h.continue;
                }

                return Boom.forbidden();
            },
        });
    },
};
