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
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
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
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/first",
        handler: controller.first,
        options: {
            validate: {
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/last",
        handler: controller.last,
        options: {
            validate: {
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.blockId,
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string(),
                }),
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
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
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/blocks/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                    orderBy: Joi.string(),
                }),
                payload: Joi.object({
                    id: server.app.schemas.orEqualCriteria(server.app.schemas.blockId),
                    version: server.app.schemas.orEqualCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    timestamp: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    previousBlock: server.app.schemas.orEqualCriteria(server.app.schemas.blockId),
                    height: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    numberOfTransactions: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    totalAmount: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    totalFee: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    reward: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    payloadLength: server.app.schemas.orNumericCriteria(
                        Joi.number()
                            .integer()
                            .min(0),
                    ),
                    payloadHash: server.app.schemas.orEqualCriteria(Joi.string().hex()),
                    generatorPublicKey: server.app.schemas.orEqualCriteria(
                        Joi.string()
                            .hex()
                            .length(66),
                    ),
                    blockSignature: server.app.schemas.orEqualCriteria(Joi.string().hex()),
                }),
            },
        },
    });
};
