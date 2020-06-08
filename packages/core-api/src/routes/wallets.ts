import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { WalletsController } from "../controllers/wallets";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(WalletsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/wallets",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        address: Joi.string().alphanum().length(34),
                        publicKey: Joi.string().hex().length(66),
                        secondPublicKey: Joi.string().hex().length(66),
                        vote: Joi.string().hex().length(66),
                        username: Joi.string(),
                        balance: Joi.number().integer(),
                        voteBalance: Joi.number().integer().min(0),
                        producedBlocks: Joi.number().integer().min(0),
                    },
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/top",
        handler: controller.top,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        address: Joi.string().alphanum().length(34),
                        publicKey: Joi.string().hex().length(66),
                        secondPublicKey: Joi.string().hex().length(66),
                        vote: Joi.string().hex().length(66),
                        username: Joi.string(),
                        balance: Joi.number().integer(),
                        voteBalance: Joi.number().integer().min(0),
                        producedBlocks: Joi.number().integer().min(0),
                    },
                }),
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
                    id: server.app.schemas.walletId,
                }),
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
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }),
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
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }),
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
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }),
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
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
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
                    id: server.app.schemas.walletId,
                }),
                query: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/wallets/search",
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
                    address: server.app.schemas.address,
                    addresses: Joi.array().unique().min(1).max(50).items(server.app.schemas.address),
                    publicKey: Joi.string().hex().length(66),
                    secondPublicKey: Joi.string().hex().length(66),
                    vote: Joi.string().hex().length(66),
                    username: Joi.string(),
                    producedBlocks: Joi.number().integer().min(0),
                    balance: Joi.object().keys({
                        from: Joi.number().integer(),
                        to: Joi.number().integer(),
                    }),
                    voteBalance: Joi.object().keys({
                        from: Joi.number().integer().min(0),
                        to: Joi.number().integer().min(0),
                    }),
                    lockedBalance: Joi.object().keys({
                        from: Joi.number().integer().min(0),
                        to: Joi.number().integer().min(0),
                    }),
                }),
            },
        },
    });
};
