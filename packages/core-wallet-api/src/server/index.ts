import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
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

    if (app.ioc.isBound("api")) {
        await server.register({
            plugin: require("hapi-rate-limit"),
            options: app.ioc.get<any>("api.options").rateLimit,
        });

        await server.register({
            plugin: plugins.whitelist,
            options: {
                whitelist: app.ioc.get<any>("api.options").whitelist,
            },
        });

        server.route({
            method: "*",
            path: "/{path*}",
            handler: {
                proxy: {
                    protocol: "http",
                    host: app.ioc.get<any>("api.options").host,
                    port: app.ioc.get<any>("api.options").port,
                    passThrough: true,
                },
            },
        });
    }

    return mountServer("Wallet API", server);
};
