import Hapi from "@hapi/hapi";

import * as LogArchived from "./routes/log-archived";

export = {
    async register(server: Hapi.Server): Promise<void> {
        const handlers = [LogArchived];

        for (const handler of handlers) {
            handler.register(server);
        }
    },
    name: "Manager API",
    version: "1.0.0",
};
