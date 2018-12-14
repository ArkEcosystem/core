import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import { registerRoutes } from "./routes";

export async function startServer(config) {
    const server = await createServer({
        host: config.host,
        port: config.port,
        routes: {
            cors: true,
            validate: {
                async failAction(request, h, err) {
                    throw err;
                },
            },
        },
    });

    await server.register({
        plugin: plugins.whitelist,
        options: {
            whitelist: config.whitelist,
            name: "Webhook API",
        },
    });

    await server.register({
        plugin: require("hapi-pagination"),
        options: {
            meta: {
                baseUri: "",
            },
            query: {
                limit: {
                    default: config.pagination.limit,
                },
            },
            results: {
                name: "data",
            },
            routes: {
                include: config.pagination.include,
                exclude: ["*"],
            },
        },
    });

    await server.register({
        plugin: registerRoutes,
        routes: { prefix: "/api" },
        options: config,
    });

    return mountServer("Webhook API", server);
}
