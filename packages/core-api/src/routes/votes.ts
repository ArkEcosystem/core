import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { VotesController } from "../controllers/votes";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(VotesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/votes",
        handler: controller.index,
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
                    ...server.app.schemas.pagination,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/votes/{id}",
        handler: controller.show,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
            },
        },
    });
};
