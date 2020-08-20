import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { LocksController } from "../controllers/locks";
import { lockCriteriaSchema, lockParamSchema } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(LocksController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/locks",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object().concat(lockCriteriaSchema).concat(Schemas.pagination_).concat(Schemas.ordering_),
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
        path: "/locks/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: lockParamSchema,
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/locks/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(Schemas.pagination_).concat(Schemas.ordering_),
                payload: Joi.array().single().items(lockCriteriaSchema),
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
        path: "/locks/unlocked",
        handler: controller.unlocked,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.orderBy,
                }),
                payload: Joi.object({
                    ids: Joi.array().unique().min(1).max(25).items(Joi.string().hex().length(64)),
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
