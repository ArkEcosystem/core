import Boom from "@hapi/boom";
import nm from "nanomatch";

export const whitelist = {
    name: "whitelist",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                const remoteAddress: string = request.info.remoteAddress;

                if (Array.isArray(options.whitelist)) {
                    for (const ip of options.whitelist) {
                        try {
                            if (nm.isMatch(remoteAddress, ip)) {
                                return h.continue;
                            }
                        } catch {
                            return Boom.forbidden();
                        }
                    }
                }

                return Boom.forbidden();
            },
        });
    },
};
