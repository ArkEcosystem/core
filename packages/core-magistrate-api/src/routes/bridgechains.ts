import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BridgechainController } from "../controllers/bridgechains";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BridgechainController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/bridgechains",
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
                        isResigned: Joi.bool(),
                    },
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/bridgechains/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string()
                        .hex()
                        .length(64), // id is genesisHash
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/bridgechains/search",
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
                    bridgechainRepository: Joi.string().max(80),
                    publicKey: Joi.string()
                        .hex()
                        .length(66),
                    genesisHash: Joi.string()
                        .hex()
                        .length(64),
                    isResigned: Joi.bool(),
                }),
            },
        },
    });
};
