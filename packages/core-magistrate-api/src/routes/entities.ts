import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { EntityController } from "../controllers/entities";
import { entityCriteriaSchemaObject, entityParamSchema } from "../resources";

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
                    .concat(Joi.object(entityCriteriaSchemaObject))
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
        path: "/entities/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object().concat(Schemas.pagination_).concat(Schemas.ordering_),
                payload: Schemas.createCriteriaPayloadSchema(entityCriteriaSchemaObject),
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
