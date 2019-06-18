import { app } from "@arkecosystem/core-container";
import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import h2o2 from "@hapi/h2o2";
import * as handlers from "./handlers";

export const startServer = async config => {
    const server = await createServer({
        host: config.host,
        port: config.port,
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
