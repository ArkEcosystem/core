import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { EntityController } from "../controllers/entities";
import {
    entityCriteriaPayloadSchema,
    entityCriteriaQuerySchema,
    entitySortingSchema,
    entityParamSchema,
} from "../resources";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(EntityController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/entities",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object()
                    .concat(entityCriteriaQuerySchema)
                    .concat(entitySortingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/entities/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(entitySortingSchema).concat(Schemas.pagination),
                payload: entityCriteriaPayloadSchema,
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/entities/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: entityParamSchema,
                }),
            },
        },
    });
};
