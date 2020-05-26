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
                    ...server.app.schemas.blockCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                    transform: Joi.bool().default(true),
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
                    ...server.app.schemas.transactionCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                    transform: Joi.bool().default(true),
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
                    orderBy: server.app.schemas.orderBy,
                    transform: Joi.bool().default(true),
                }),
                payload: Joi.object({
                    ...server.app.schemas.blockCriteriaSchemas,
                }),
            },
        },
    });
};
