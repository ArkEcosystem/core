import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { DelegatesController } from "../controllers/delegates";
import { delegateCriteriaSchemaObject, delegateParamSchema, walletCriteriaSchemaObject } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(DelegatesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/delegates",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object()
                    .concat(Joi.object(delegateCriteriaSchemaObject))
                    .concat(Schemas.pagination_)
                    .concat(Schemas.ordering_),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/delegates/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(Schemas.pagination_).concat(Schemas.ordering_),
                payload: Schemas.createCriteriaPayloadSchema(delegateCriteriaSchemaObject),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: delegateParamSchema,
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: controller.voters,
        options: {
            validate: {
                params: Joi.object({
                    id: delegateParamSchema,
                }),
                validate: {
                    query: Joi.object()
                        .concat(Joi.object(walletCriteriaSchemaObject))
                        .concat(Schemas.pagination_)
                        .concat(Schemas.ordering_),
                },
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/blocks",
        handler: controller.blocks,
        options: {
            validate: {
                params: Joi.object({
                    id: delegateParamSchema,
                }),
                query: Joi.object({
                    ...server.app.schemas.blockCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.blocksOrderBy,
                    transform: Joi.bool().default(true),
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
