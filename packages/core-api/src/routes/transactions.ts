import { Container, Providers } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { TransactionsController } from "../controllers/transactions";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(TransactionsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/transactions",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        id: Joi.string().hex().length(64),
                        blockId: server.app.schemas.blockId,
                        type: Joi.number().integer().min(0),
                        typeGroup: Joi.number().integer().min(0),
                        version: Joi.number().integer().positive(),
                        senderPublicKey: Joi.string().hex().length(66),
                        senderId: Joi.string().alphanum().length(34),
                        recipientId: Joi.string().alphanum().length(34),
                        timestamp: Joi.number().integer().min(0),
                        nonce: Joi.number().integer().min(0),
                        amount: Joi.number().integer().min(0),
                        fee: Joi.number().integer().min(0),
                        vendorField: Joi.string().max(255, "utf8"),
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/transactions",
        handler: controller.store,
        options: {
            plugins: {
                "hapi-ajv": {
                    payloadSchema: {
                        type: "object",
                        required: ["transactions"],
                        additionalProperties: false,
                        properties: {
                            transactions: {
                                $ref: "transactions",
                                minItems: 1,
                                maxItems: server.app.app
                                    .getTagged<Providers.PluginConfiguration>(
                                        Container.Identifiers.PluginConfiguration,
                                        "plugin",
                                        "@arkecosystem/core-transaction-pool",
                                    )
                                    .get<number>("maxTransactionsPerRequest"),
                            },
                        },
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed",
        handler: controller.unconfirmed,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/{id}",
        handler: controller.showUnconfirmed,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/transactions/search",
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
                    senderId: server.app.schemas.orEqualCriteria(server.app.schemas.address),
                    id: server.app.schemas.orEqualCriteria(Joi.string().hex().length(64)),
                    version: server.app.schemas.orEqualCriteria(Joi.number().integer().positive()),
                    blockId: server.app.schemas.orEqualCriteria(server.app.schemas.blockId),
                    sequence: server.app.schemas.orNumericCriteria(Joi.number().integer().positive()),
                    timestamp: server.app.schemas.orNumericCriteria(Joi.number().integer().min(0)),
                    nonce: server.app.schemas.orNumericCriteria(Joi.number().integer().positive()),
                    senderPublicKey: server.app.schemas.orEqualCriteria(Joi.string().hex().length(66)),
                    recipientId: server.app.schemas.orEqualCriteria(server.app.schemas.address),
                    type: server.app.schemas.orEqualCriteria(Joi.number().integer().min(0)),
                    typeGroup: server.app.schemas.orEqualCriteria(Joi.number().integer().min(0)),
                    vendorField: server.app.schemas.orLikeCriteria(Joi.string().max(255, "utf8")),
                    amount: server.app.schemas.orNumericCriteria(Joi.number().integer().min(0)),
                    fee: server.app.schemas.orNumericCriteria(Joi.number().integer().min(0)),
                    asset: server.app.schemas.orContainsCriteria(Joi.object()),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/types",
        handler: controller.types,
    });

    server.route({
        method: "GET",
        path: "/transactions/schemas",
        handler: controller.schemas,
    });

    server.route({
        method: "GET",
        path: "/transactions/fees",
        handler: controller.fees,
    });
};
