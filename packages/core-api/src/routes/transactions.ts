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
                    ...server.app.schemas.transactionCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                    estimateTotalCount: server.app.schemas.estimateTotalCount,
                    transform: Joi.bool().default(true),
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
                    orderBy: server.app.schemas.orderBy,
                    estimateTotalCount: server.app.schemas.estimateTotalCount,
                    transform: Joi.bool().default(true),
                }),
                payload: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
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
