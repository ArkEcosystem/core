import { Container, Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { getIp } from "../utils";

export const log = {
    name: "log",
    version: "1.0.0",

    register(
        server: Hapi.Server,
        options: {
            enabled: boolean;
            trustProxy: boolean;
        },
    ): void {
        if (!options.enabled) {
            return;
        }

        const logger = server.app.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService);

        server.ext("onRequest", (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            logger.debug(
                `API request on: "${request.path}" from: "${getIp(request, options.trustProxy)}" with query: "${
                    request.url.search
                }"`,
            );

            return h.continue;
        });
    },
};
