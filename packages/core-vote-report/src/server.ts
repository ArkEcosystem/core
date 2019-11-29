import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import * as Handlebars from "handlebars";
import { handler } from "./handler";

export const startServer = async config => {
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
        [require("@hapi/vision")],
    );

    server.route({
        method: "GET",
        path: "/",
        handler,
    });

    return mountServer("Vote Report", server);
};
