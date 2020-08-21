import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { DelegatesController } from "../controllers/delegates";
import {
    delegateCriteriaPayloadSchema,
    delegateCriteriaQuerySchema,
    delegateOrderingSchema,
    delegateParamSchema,
    walletCriteriaQuerySchema,
    walletOrderingSchema,
} from "../resources-new";
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
                    .concat(delegateCriteriaQuerySchema)
                    .concat(delegateOrderingSchema)
                    .concat(Schemas.pagination),
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
                query: Joi.object().concat(delegateOrderingSchema).concat(Schemas.pagination),
                payload: delegateCriteriaPayloadSchema,
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
        path: "/delegates/{id}/blocks",
        handler: controller.blocks,
        options: {
            validate: {
                params: Joi.object({
                    id: delegateParamSchema,
                }),
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
};
