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
                        bridgechainId: Joi.number()
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
                    id: Joi.number()
                        .integer()
                        .min(1),
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
                    bridgechainId: Joi.number()
                        .integer()
                        .min(1),
                },
            },
        },
    });
};
