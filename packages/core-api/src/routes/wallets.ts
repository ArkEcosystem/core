import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { WalletsController } from "../controllers/wallets";
import {
    lockCriteriaQuerySchema,
    lockOrderingSchema,
    lockParamSchema,
    walletCriteriaPayloadSchema,
    walletCriteriaQuerySchema,
    walletOrderingSchema,
    walletParamSchema,
} from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(WalletsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/wallets",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object()
                    .concat(walletCriteriaQuerySchema)
                    .concat(walletOrderingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/top",
        handler: controller.top,
        options: {
            validate: {
                query: Joi.object()
                    .concat(walletCriteriaQuerySchema)
                    .concat(walletOrderingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/wallets/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(walletOrderingSchema).concat(Schemas.pagination),
                payload: walletCriteriaPayloadSchema,
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: walletParamSchema,
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/locks",
        handler: controller.locks,
        options: {
            validate: {
                params: Joi.object({
                    id: lockParamSchema,
                }),
                query: Joi.object()
                    .concat(lockCriteriaQuerySchema)
                    .concat(lockOrderingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.walletId,
                }),
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
        method: "GET",
        path: "/wallets/{id}/transactions/sent",
        handler: controller.transactionsSent,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.walletId,
                }),
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
        method: "GET",
        path: "/wallets/{id}/transactions/received",
        handler: controller.transactionsReceived,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.walletId,
                }),
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
        method: "GET",
        path: "/wallets/{id}/votes",
        handler: controller.votes,
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.walletId,
                }),
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
};
