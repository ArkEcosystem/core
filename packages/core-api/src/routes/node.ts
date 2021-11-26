import Hapi from "@hapi/hapi";
import Joi from "joi";

import { NodeController } from "../controllers/node";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(NodeController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/node/status",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.status(request, h),
    });

    server.route({
        method: "GET",
        path: "/node/syncing",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.syncing(request, h),
    });

    server.route({
        method: "GET",
        path: "/node/configuration",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.configuration(request, h),
    });

    server.route({
        method: "GET",
        path: "/node/configuration/crypto",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.configurationCrypto(request, h),
    });

    server.route({
        method: "GET",
        path: "/node/fees",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.fees(request, h),
        options: {
            validate: {
                query: Joi.object({
                    days: Joi.number().integer().min(1).max(30),
                }),
            },
        },
    });
};
