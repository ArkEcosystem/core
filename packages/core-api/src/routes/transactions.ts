import { Container, Providers } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { TransactionsController } from "../controllers/transactions";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(TransactionsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/transactions",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.index(request, h),
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }).concat(Schemas.pagination),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/transactions",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.store(request, h),
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
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.show(request, h),
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
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.unconfirmed(request, h),
        options: {
            validate: {
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }).concat(Schemas.pagination),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/unconfirmed/{id}",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.showUnconfirmed(request, h),
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/transactions/types",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.types(request, h),
    });

    server.route({
        method: "GET",
        path: "/transactions/schemas",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.schemas(request, h),
    });

    server.route({
        method: "GET",
        path: "/transactions/fees",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.fees(request, h),
    });
};
