import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import * as Handlebars from "handlebars";
import { handler } from "./handler";

export async function startServer(config) {
    const server = await createServer(
        {
            host: config.host,
            port: config.port,
        },
        instance =>
            instance.views({
                engines: { html: Handlebars },
                relativeTo: __dirname,
                path: "templates",
            }),
        [require("vision")],
    );

    // @ts-ignore
    server.app.config = config;

    server.route({
        method: "GET",
        path: "/",
        handler,
    });

    return mountServer("Vote Report", server);
}
