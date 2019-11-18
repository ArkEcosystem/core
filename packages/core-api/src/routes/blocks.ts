import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BlocksController } from "../controllers/blocks";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BlocksController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blocks",
        handler: controller.index,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: Joi.string(),
                        id: server.app.schemas.blockId,
                        version: Joi.number()
                            .integer()
                            .min(0),
                        timestamp: Joi.number()
                            .integer()
                            .min(0),
                        previousBlock: server.app.schemas.blockId,
                        height: Joi.number()
                            .integer()
                            .positive(),
                        numberOfTransactions: Joi.number()
                            .integer()
                            .min(0),
                        totalAmount: Joi.number()
                            .integer()
                            .min(0),
                        totalFee: Joi.number()
                            .integer()
                            .min(0),
                        reward: Joi.number()
                            .integer()
                            .min(0),
                        payloadLength: Joi.number()
                            .integer()
                            .positive(),
                        payloadHash: Joi.string().hex(),
                        generatorPublicKey: Joi.string()
                            .hex()
                            .length(66),
                        blockSignature: Joi.string().hex(),
                        transform: Joi.bool().default(true),
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/first",
        handler: controller.first,
        options: {
            validate: {
                query: {
                    transform: Joi.bool().default(true),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/last",
        handler: controller.last,
        options: {
            validate: {
                query: {
                    transform: Joi.bool().default(true),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: {
                    id: server.app.schemas.blockId,
                },
                query: {
                    transform: Joi.bool().default(true),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: {
                params: {
                    id: Joi.string(),
                },
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: Joi.string(),
                        id: Joi.string()
                            .hex()
                            .length(66),
                        blockId: server.app.schemas.blockId,
                        type: Joi.number()
                            .integer()
                            .min(0),
                        version: Joi.number()
                            .integer()
                            .min(0),
                        senderPublicKey: Joi.string()
                            .hex()
                            .length(66),
                        senderId: Joi.string()
                            .alphanum()
                            .length(34),
                        recipientId: Joi.string()
                            .alphanum()
                            .length(34),
                        timestamp: Joi.number()
                            .integer()
                            .min(0),
                        amount: Joi.number()
                            .integer()
                            .min(0),
                        fee: Joi.number()
                            .integer()
                            .min(0),
                        vendorField: Joi.string().max(255, "utf8"),
                        transform: Joi.bool().default(true),
                    },
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/blocks/search",
        handler: controller.search,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                },
                payload: {
                    id: server.app.schemas.blockId,
                    version: Joi.number()
                        .integer()
                        .min(0),
                    previousBlock: server.app.schemas.blockId,
                    payloadHash: Joi.string().hex(),
                    generatorPublicKey: Joi.string()
                        .hex()
                        .length(66),
                    blockSignature: Joi.string().hex(),
                    timestamp: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    height: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .positive(),
                        to: Joi.number()
                            .integer()
                            .positive(),
                    }),
                    numberOfTransactions: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    totalAmount: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    totalFee: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    reward: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    payloadLength: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                },
            },
        },
    });
};
