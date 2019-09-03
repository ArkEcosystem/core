import { createServer, plugins } from "@arkecosystem/core-http-utils";
import { app } from "@arkecosystem/core-kernel";
import h2o2 from "@hapi/h2o2";

import * as handlers from "./handlers";

export const startServer = async config => {
    const server = await createServer({
        host: config.host,
        port: config.port,
    });

    // @ts-ignore
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

    if (app.isBound("api")) {
        await server.register({
            plugin: require("hapi-rate-limit"),
            options: app.get<any>("api.options").rateLimit,
        });

        await server.register({
            plugin: plugins.whitelist,
            options: {
                whitelist: app.get<any>("api.options").whitelist,
            },
        });

        server.route({
            method: "*",
            path: "/{path*}",
            handler: {
                proxy: {
                    protocol: "http",
                    host: app.get<any>("api.options").host,
                    port: app.get<any>("api.options").port,
                    passThrough: true,
                },
            },
        });
    }

    try {
        await server.start();

        app.log.info(`Wallet API Server running at: ${server.info.uri}`);
    } catch (error) {
        await app.terminate(`Could not start Wallet API Server!`, error);
    }

    return server;
};
