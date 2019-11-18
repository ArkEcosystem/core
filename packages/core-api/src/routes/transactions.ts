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
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: Joi.string(),
                        id: Joi.string()
                            .hex()
                            .length(64),
                        blockId: server.app.schemas.blockId,
                        type: Joi.number()
                            .integer()
                            .min(0),
                        typeGroup: Joi.number()
                            .integer()
                            .min(0),
                        version: Joi.number()
                            .integer()
                            .positive(),
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
                        nonce: Joi.number()
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
                                    .get<Providers.ServiceProviderRepository>(
                                        Container.Identifiers.ServiceProviderRepository,
                                    )
                                    .get("transactionPool")
                                    .config()
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
                params: {
                    id: Joi.string()
                        .hex()
                        .length(64),
                },
                query: {
                    transform: Joi.bool().default(true),
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed",
        handler: controller.unconfirmed,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        transform: Joi.bool().default(true),
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/{id}",
        handler: controller.showUnconfirmed,
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
        path: "/transactions/search",
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
                    orderBy: Joi.string(),
                    id: Joi.string()
                        .hex()
                        .length(64),
                    blockId: server.app.schemas.blockId,
                    type: Joi.number()
                        .integer()
                        .min(0),
                    typeGroup: Joi.number()
                        .integer()
                        .min(0),
                    version: Joi.number()
                        .integer()
                        .positive(),
                    senderPublicKey: Joi.string()
                        .hex()
                        .length(66),
                    senderId: server.app.schemas.address,
                    recipientId: server.app.schemas.address,
                    addresses: Joi.array()
                        .unique()
                        .min(1)
                        .max(50)
                        .items(server.app.schemas.address),
                    vendorField: Joi.string().max(255, "utf8"),
                    timestamp: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    nonce: Joi.number()
                        .integer()
                        .min(0),
                    amount: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    fee: Joi.object().keys({
                        from: Joi.number()
                            .integer()
                            .min(0),
                        to: Joi.number()
                            .integer()
                            .min(0),
                    }),
                    asset: Joi.object(),
                },
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
