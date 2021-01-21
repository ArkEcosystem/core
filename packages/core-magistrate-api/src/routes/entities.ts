import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { EntityController } from "../controllers/entities";
import { entityCriteriaSchema, entityParamSchema, entitySortingSchema } from "../resources";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(EntityController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/entities",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object().concat(entityCriteriaSchema).concat(entitySortingSchema).concat(Schemas.pagination),
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
