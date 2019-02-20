import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import { randomBytes } from "crypto";
import { database } from "../database";
import * as schema from "./schema";
import * as utils from "./utils";

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
                    default: 100,
                },
            },
            results: {
                name: "data",
            },
            routes: {
                include: ["/api/webhooks"],
                exclude: ["*"],
            },
        },
    });

    server.route({
        method: "GET",
        path: "/api/webhooks",
        handler: request => {
            return utils.toPagination(database.paginate(utils.paginate(request)));
        },
    });

    server.route({
        method: "POST",
        path: "/api/webhooks",
        handler(request: any, h) {
            const token = randomBytes(32).toString("hex");
            request.payload.token = token.substring(0, 32);

            const webhook: any = database.create(request.payload);
            webhook.token = token;

            return h.response(utils.respondWithResource(webhook)).code(201);
        },
        options: {
            plugins: {
                pagination: {
                    enabled: false,
                },
            },
            validate: schema.store,
        },
    });

    server.route({
        method: "GET",
        path: "/api/webhooks/{id}",
        async handler(request) {
            const webhook: any = database.findById(request.params.id);
            delete webhook.token;

            return utils.respondWithResource(webhook);
        },
        options: {
            validate: schema.show,
        },
    });

    server.route({
        method: "PUT",
        path: "/api/webhooks/{id}",
        handler: (request, h) => {
            database.update(request.params.id, request.payload);

            return h.response(null).code(204);
        },
        options: {
            validate: schema.update,
        },
    });

    server.route({
        method: "DELETE",
        path: "/api/webhooks/{id}",
        handler: (request, h) => {
            database.destroy(request.params.id);

            return h.response(null).code(204);
        },
        options: {
            validate: schema.destroy,
        },
    });

    return mountServer("Webhook API", server);
}
