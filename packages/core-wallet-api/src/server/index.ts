import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import * as handlers from "./handlers";

export const startServer = async config => {
    const server = await createServer({
        host: "0.0.0.0",
        port: 4040,
    });

    await server.register({
        plugin: plugins.corsHeaders,
    });

    server.route([{ method: "GET", path: "/", ...handlers.config }]);

    return mountServer("Wallet API", server);
};
