import Hapi from "@hapi/hapi";
import Joi from "joi";

import { PeersController } from "../controllers/peers";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(PeersController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/peers",
        handler: (request: Hapi.Request) => controller.index(request),
        options: {
            validate: {
                query: Joi.object({
                    ip: Joi.string().ip({ version: ["ipv4", "ipV6"] }),
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
        handler: (request: Hapi.Request) => controller.show(request),
        options: {
            validate: {
                params: Joi.object({
                    ip: Joi.string().ip({ version: ["ipv4", "ipV6"] }),
                }),
            },
        },
    });
};
