import { HttpServer } from "@arkecosystem/core-http-utils";
import { Contracts } from "@arkecosystem/core-kernel";
import Vision from "@hapi/vision";
import * as Handlebars from "handlebars";

import { handler } from "./handler";

export const startServer = async (app: Contracts.Kernel.Application, config) => {
    const server = app.resolve<HttpServer>(HttpServer);

    await server.init("Vote Report", {
        host: config.host,
        port: config.port,
    });

    server.register(Vision);

    server.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: "templates",
    });

    server.route({
        method: "GET",
        path: "/",
        handler,
    });

    await server.start();

    return server;
};
