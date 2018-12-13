import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import { routes } from "./routes";

export async function startServer(config) {
    const server = await createServer({
        host: config.host,
        port: config.port,
        routes: {
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
            name: "Elasticsearch API",
        },
    });

    await server.register(routes);

    return mountServer("Elasticsearch API", server);
}
