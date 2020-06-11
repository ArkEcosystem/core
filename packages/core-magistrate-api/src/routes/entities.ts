import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { EntityController } from "../controllers/entities";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(EntityController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/entities",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                        publicKey: Joi.string().hex().length(66),
                        type: Joi.number().integer(), // see enum in core-magistrate-crypto
                        subType: Joi.number().integer(), // see enum in core-magistrate-crypto
                        name: Joi.string()
                            .regex(/^[a-zA-Z0-9_-]+$/)
                            .max(40),
                        isResigned: Joi.bool(),
                    },
                }),
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
                    id: Joi.string().hex().length(64), // id is registration tx id
                }),
            },
        },
    });

    server.route({
        method: "POST",
        path: "/entities/search",
        handler: controller.search,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: server.app.schemas.orderBy,
                    },
                }),
                payload: Joi.object({
                    publicKey: Joi.string().hex().length(66),
                    type: Joi.number().integer(), // see enum in core-magistrate-crypto
                    subType: Joi.number().integer(), // see enum in core-magistrate-crypto
                    name: Joi.string()
                        .regex(/^[a-zA-Z0-9_-]+$/)
                        .max(40),
                    isResigned: Joi.bool(),
                }),
            },
        },
    });
};
