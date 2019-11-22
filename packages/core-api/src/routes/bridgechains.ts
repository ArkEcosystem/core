import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BridgechainController } from "../controllers/bridgechains";
import { orderBy } from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BridgechainController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/bridgechains",
        handler: controller.index,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy,
                        businessId: Joi.number()
                            .integer()
                            .min(1),
                        bridgechainRepository: Joi.string().max(80),
                        genesisHash: Joi.string()
                            .hex()
                            .length(64),
                        name: Joi.string()
                            .regex(/^[a-zA-Z0-9_-]+$/)
                            .max(40),
                        seedNodes: Joi.array()
                            .unique()
                            .min(1)
                            .max(10)
                            .items(Joi.string().ip()),

                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/bridgechains/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: {
                    id: Joi.string()
                        .hex()
                        .length(64),
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/bridgechains/search",
        handler: controller.search,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy,
                    },
                },
                payload: {
                    bridgechainRepository: Joi.string().max(80),
                    businessId: Joi.number()
                        .integer().positive(),
                },
            },
        },
    });
};
