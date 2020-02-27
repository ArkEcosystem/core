import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BusinessController } from "../controllers/businesses";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BusinessController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/businesses",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        publicKey: Joi.string()
                            .hex()
                            .length(66),
                        isResigned: Joi.bool(),
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/businesses/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string()
                        .hex()
                        .length(66),
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/businesses/{id}/bridgechains",
        handler: controller.bridgechains,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string()
                        .hex()
                        .length(66),
                }),
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        isResigned: Joi.bool(),
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/businesses/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                    },
                }),
                payload: Joi.object({
                    publicKey: Joi.string()
                        .hex()
                        .length(66),
                    name: Joi.string()
                        .regex(/^[a-zA-Z0-9_-]+$/)
                        .max(40),
                    website: Joi.string().max(80),
                    vat: Joi.string()
                        .alphanum()
                        .max(15),
                    repository: Joi.string().max(80),
                    isResigned: Joi.bool(),
                }),
            },
        },
    });
};
