import Hapi from "@hapi/hapi";
import Joi from "joi";

import { BlocksController } from "../controllers/blocks";
import { blockQueryLevelOptions, blockSortingSchema, transactionSortingSchema } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BlocksController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blocks",
        handler: (request: Hapi.Request) => controller.index(request),
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.blockCriteriaSchemas,
                    orderBy: server.app.schemas.blocksOrderBy,
                    transform: Joi.bool().default(true),
                })
                    .concat(blockSortingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                semaphore: {
                    enabled: true,
                    type: "database",
                    queryLevelOptions: blockQueryLevelOptions,
                },
                pagination: {
                    enabled: true,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/first",
        handler: (request: Hapi.Request) => controller.first(request),
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
        handler: (request: Hapi.Request) => controller.last(request),
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
        handler: (request: Hapi.Request) => controller.show(request),
        options: {
            validate: {
                params: Joi.object({
                    id: server.app.schemas.blockId,
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
            plugins: {
                semaphore: {
                    enabled: true,
                    type: "database",
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}/transactions",
        handler: (request: Hapi.Request) => controller.transactions(request),
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string(),
                }),
                query: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                })
                    .concat(transactionSortingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                semaphore: {
                    enabled: true,
                    type: "database",
                },
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
