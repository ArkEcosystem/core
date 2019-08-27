import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import Boom from "@hapi/boom";
import { randomBytes } from "crypto";
import { database } from "../database";
import { Webhook } from "../interfaces";
import * as schema from "./schema";
import * as utils from "./utils";

export const startServer = async config => {
    const server = await createServer({
        host: config.host,
        port: config.port,
        routes: {
            cors: true,
        },
    });

    await server.register({
        plugin: plugins.whitelist,
        options: {
            whitelist: config.whitelist,
        },
    });

    server.route({
        method: "GET",
        path: "/api/webhooks",
        handler: () => {
            return {
                data: database.all().map(webhook => {
                    webhook = { ...webhook };
                    delete webhook.token;
                    return webhook;
                }),
            };
        },
    });

    server.route({
        method: "POST",
        path: "/api/webhooks",
        handler(request: any, h) {
            const token: string = randomBytes(32).toString("hex");

            return h
                .response(
                    utils.respondWithResource({
                        ...database.create({
                            ...request.payload,
                            ...{ token: token.substring(0, 32) },
                        }),
                        ...{ token },
                    }),
                )
                .code(201);
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
            if (!database.hasById(request.params.id)) {
                return Boom.notFound();
            }

            const webhook: Webhook = { ...database.findById(request.params.id) };
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
            if (!database.hasById(request.params.id)) {
                return Boom.notFound();
            }

            database.update(request.params.id, request.payload as Webhook);

            return h.response(undefined).code(204);
        },
        options: {
            validate: schema.update,
        },
    });

    server.route({
        method: "DELETE",
        path: "/api/webhooks/{id}",
        handler: (request, h) => {
            if (!database.hasById(request.params.id)) {
                return Boom.notFound();
            }

            database.destroy(request.params.id);

            return h.response(undefined).code(204);
        },
        options: {
            validate: schema.destroy,
        },
    });

    return mountServer("Webhook API", server);
};
