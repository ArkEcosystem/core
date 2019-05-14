import { app } from "@arkecosystem/core-container";
import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import h2o2 from "@hapi/h2o2";
import * as handlers from "./handlers";

export const startServer = async () => {
    const server = await createServer({
        host: "0.0.0.0",
        port: 4040,
    });

    await server.register(h2o2);

    await server.register({
        plugin: plugins.corsHeaders,
    });

    server.route({
        method: "GET",
        path: "/",
        handler() {
            return { data: "Hello World!" };
        },
    });

    server.route([{ method: "GET", path: "/config", ...handlers.config }]);

    if (app.has("api")) {
        server.route({
            method: "*",
            path: "/{path*}",
            handler: {
                proxy: {
                    protocol: "http",
                    host: app.resolveOptions("api").host,
                    port: app.resolveOptions("api").port,
                    passThrough: true,
                },
            },
        });
    }

    return mountServer("Wallet API", server);
};
