import Hapi from "@hapi/hapi";
import Joi from "joi";

import { LocksController } from "../controllers/locks";
import { lockCriteriaSchema, lockParamSchema, lockSortingSchema } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(LocksController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/locks",
        handler: (request: Hapi.Request) => controller.index(request),
        options: {
            validate: {
                query: Joi.object().concat(lockCriteriaSchema).concat(lockSortingSchema).concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/locks/{id}",
        handler: (request: Hapi.Request) => controller.show(request),
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
        path: "/locks/unlocked",
        handler: (request: Hapi.Request) => controller.unlocked(request),
        options: {
            validate: {
                query: Joi.object({
                    orderBy: server.app.schemas.orderBy,
                }).concat(Schemas.pagination),
                payload: Joi.object({
                    ids: Joi.array().unique().min(1).max(25).items(Joi.string().hex().length(64)).required(),
                }).required(),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
