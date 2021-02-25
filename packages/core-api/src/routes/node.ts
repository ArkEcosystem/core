import Hapi from "@hapi/hapi";
import Joi from "joi";

import { NodeController } from "../controllers/node";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(NodeController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/node/status",
        handler: (request: Hapi.Request) => controller.status(request),
    });

    server.route({
        method: "GET",
        path: "/node/syncing",
        handler: (request: Hapi.Request) => controller.syncing(request),
    });

    server.route({
        method: "GET",
        path: "/node/configuration",
        handler: (request: Hapi.Request) => controller.configuration(request),
    });

    server.route({
        method: "GET",
        path: "/node/configuration/crypto",
        handler: (request: Hapi.Request) => controller.configurationCrypto(request),
    });

    server.route({
        method: "GET",
        path: "/node/fees",
        handler: (request: Hapi.Request) => controller.fees(request),
        options: {
            validate: {
                query: Joi.object({
                    days: Joi.number().integer().min(1).max(30),
                }),
            },
        },
    });
};
