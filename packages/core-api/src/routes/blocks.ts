import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BlocksController } from "../controllers/blocks";
import * as Schemas from "../schemas";

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
                    ...server.app.schemas.blockCriteriaSchemas,
                    orderBy: server.app.schemas.blocksOrderBy,
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
        path: "/blocks/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    orderBy: server.app.schemas.blocksOrderBy,
                    transform: Joi.bool().default(true),
                }).concat(Schemas.pagination),
                payload: Joi.object({
                    ...server.app.schemas.blockCriteriaSchemas,
                }),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
