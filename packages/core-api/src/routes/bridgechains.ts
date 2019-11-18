import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { BridgechainController } from "../controllers/bridgechains";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BridgechainController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/bridgechains",
        handler: controller.index,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: Joi.string(),
                        bridgechainId: Joi.number()
                            .integer()
                            .min(1),
                    },
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/bridgechains/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: {
                    id: Joi.number()
                        .integer()
                        .min(1),
                },
            },
        },
    });

    server.route({
        method: "POST",
        path: "/bridgechains/search",
        handler: controller.search,
        options: {
            validate: {
                query: {
                    ...server.app.schemas.pagination,
                    ...{
                        orderBy: Joi.string(),
                    },
                },
                payload: {
                    bridgechainId: Joi.number()
                        .integer()
                        .min(1),
                },
            },
        },
    });
};
