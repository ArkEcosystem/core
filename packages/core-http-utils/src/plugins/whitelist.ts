import { app } from "@arkecosystem/core-container";
import Boom from "boom";
import mm from "micromatch";

export const whitelist = {
    name: "whitelist",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                const remoteAddress = request.info.remoteAddress;

                if (Array.isArray(options.whitelist)) {
                    for (const ip of options.whitelist) {
                        try {
                            if (mm.isMatch(remoteAddress, ip)) {
                                return h.continue;
                            }
                        } catch {
                            return Boom.forbidden();
                        }
                    }
                }

                app.resolvePlugin("logger").warn(
                    `${remoteAddress} tried to access the ${options.name} without being whitelisted :warning:`,
                );

                return Boom.forbidden();
            },
        });
    },
};
