import { Contracts, Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { randomBytes } from "crypto";

import { Database } from "../database";
import { Webhook } from "../interfaces";
import { Server } from "./hapi";
import { whitelist } from "./plugins/whitelist";
import * as schema from "./schema";
import * as utils from "./utils";

export const startServer = async (app: Contracts.Kernel.Application, config): Promise<Server> => {
    const server = app.resolve<Server>(Server);

    await server.init("Webhook API", {
        host: config.host,
        port: config.port,
        routes: {
            cors: true,
        },
    });

    await server.register({
        plugin: whitelist,
        options: {
            whitelist: config.whitelist,
        },
    });

    server.route({
        method: "GET",
        path: "/api/webhooks",
        handler: () => {
            return {
                data: app
                    .get<Database>("webhooks.db")
                    .all()
                    .map(webhook => {
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
                        ...app.get<Database>("webhooks.db").create({
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
            if (!app.get<Database>("webhooks.db").hasById(request.params.id)) {
                return Boom.notFound();
            }

            const webhook: Webhook | undefined = Utils.cloneDeep(
                app.get<Database>("webhooks.db").findById(request.params.id),
            );

            if (!webhook) {
                return Boom.badImplementation();
            }

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
            if (!app.get<Database>("webhooks.db").hasById(request.params.id)) {
                return Boom.notFound();
            }

            app.get<Database>("webhooks.db").update(request.params.id, request.payload as Webhook);

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
            if (!app.get<Database>("webhooks.db").hasById(request.params.id)) {
                return Boom.notFound();
            }

            app.get<Database>("webhooks.db").destroy(request.params.id);

            return h.response(undefined).code(204);
        },
        options: {
            validate: schema.destroy,
        },
    });

    await server.start();

    return server;
};
