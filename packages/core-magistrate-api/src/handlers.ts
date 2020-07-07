import Hapi from "@hapi/hapi";

import * as Entities from "./routes/entities";

export = {
    async register(server: Hapi.Server): Promise<void> {
        Entities.register(server);
    },
    name: "Magistrate API",
    version: "2.0.0",
};
