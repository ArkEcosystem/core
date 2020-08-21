import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { PeersController } from "../controllers/peers";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(PeersController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/peers",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ip: Joi.string().ip(),
                    version: Joi.string(),
                    orderBy: server.app.schemas.orderBy,
                }).concat(Schemas.pagination),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/peers/{ip}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    ip: Joi.string().ip(),
                }),
            },
        },
    });
};
