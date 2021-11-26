import Hapi from "@hapi/hapi";
import Joi from "joi";

import { LocksController, UnlockedRequest } from "../controllers/locks";
import { lockCriteriaSchema, lockParamSchema, lockSortingSchema } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(LocksController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/locks",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.index(request, h),
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
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.show(request, h),
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
        handler: (request: UnlockedRequest, h: Hapi.ResponseToolkit) => controller.unlocked(request, h),
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
