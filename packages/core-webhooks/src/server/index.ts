import { createServer, mountServer, plugins } from "@arkecosystem/core-http-utils";
import Boom from "@hapi/boom";
import { randomBytes } from "crypto";
import { database } from "../database";
import { IWebhook } from "../interfaces";
import * as schema from "./schema";
import * as utils from "./utils";

export const startServer = async config => {
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

    server.route({
        method: "GET",
        path: "/api/webhooks",
        handler: request => {
            return {
                data: database.all(),
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
            const webhook: IWebhook = database.findById(request.params.id);
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
            database.update(request.params.id, request.payload as IWebhook);

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
            try {
                database.destroy(request.params.id);

                return h.response(undefined).code(204);
            } catch (error) {
                return Boom.notFound();
            }
        },
        options: {
            validate: schema.destroy,
        },
    });

    return mountServer("Webhook API", server);
};
