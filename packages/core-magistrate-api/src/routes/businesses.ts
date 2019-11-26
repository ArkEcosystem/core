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
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
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
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/businesses/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: {
                    id: Joi.string()
                        .hex()
                        .length(66),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/businesses/{id}/bridgechains",
        handler: controller.bridgechains,
        options: {
            validate: {
                params: {
                    id: Joi.string()
                        .hex()
                        .length(66),
                },
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                    },
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/businesses/search",
        handler: controller.search,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                    },
                },
                payload: {
                    publicKey: Joi.string()
                        .hex()
                        .length(66),
                },
            },
        },
    });
};
