import Hapi from "@hapi/hapi";

import * as Bridgechains from "./routes/bridgechains";
import * as Businesses from "./routes/businesses";

export = {
    async register(server: Hapi.Server): Promise<void> {
        Businesses.register(server);
        Bridgechains.register(server);
    },
    name: "Magistrate API",
    version: "2.0.0",
};
