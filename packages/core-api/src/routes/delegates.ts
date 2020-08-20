import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { DelegatesController } from "../controllers/delegates";
import { delegateCriteriaSchema, delegateParamSchema } from "../resources-new";
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
                    .concat(delegateCriteriaSchema)
                    .concat(Schemas.pagination_)
                    .concat(Schemas.ordering_),
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

    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: controller.voters,
        options: {
            validate: {
                params: Joi.object({
                    id: delegateParamSchema,
                }),
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        id: server.app.schemas.blockId,
                        version: Joi.number().integer().min(0),
                        timestamp: Joi.number().integer().min(0),
                        previousBlock: server.app.schemas.blockId,
                        height: Joi.number().integer().positive(),
                        numberOfTransactions: Joi.number().integer().min(0),
                        totalAmount: Joi.number().integer().min(0),
                        totalFee: Joi.number().integer().min(0),
                        reward: Joi.number().integer().min(0),
                        payloadLength: Joi.number().integer().min(0),
                        payloadHash: Joi.string().hex(),
                        generatorPublicKey: Joi.string().hex().length(66),
                        blockSignature: Joi.string().hex(),
                        transform: Joi.bool().default(true),
                    },
                }),
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
        path: "/delegates/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(Schemas.pagination_).concat(Schemas.ordering_),
                payload: Joi.array().single().items(delegateCriteriaSchema),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
