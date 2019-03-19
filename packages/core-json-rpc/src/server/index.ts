import { app } from "@arkecosystem/core-container";
import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import { Logger } from "@arkecosystem/core-interfaces";
import { registerMethods } from "./methods";
import { Processor } from "./services/processor";

export async function startServer(options) {
    if (options.allowRemote) {
        app.resolvePlugin<Logger.ILogger>("logger").warn(
            "JSON-RPC server allows remote connections, this is a potential security risk",
        );
    }

    const server = await createServer({
        host: options.host,
        port: options.port,
    });

    // @ts-ignore
    server.app.schemas = {};

    if (!options.allowRemote) {
        await server.register({
            plugin: plugins.whitelist,
            options: {
                whitelist: options.whitelist,
                name: "JSON-RPC",
            },
        });
    }

    // @ts-ignore
    registerMethods(server);

    server.route({
        method: "POST",
        path: "/",
        async handler(request, h) {
            const processor = new Processor();

            return Array.isArray(request.payload)
                ? processor.collection(request.server, request.payload)
                : processor.resource(request.server, request.payload);
        },
    });

    return mountServer("JSON-RPC", server);
}
