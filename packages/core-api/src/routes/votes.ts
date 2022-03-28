import Hapi from "@hapi/hapi";
import Joi from "joi";

import { VotesController } from "../controllers/votes";
import { transactionSortingSchema } from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(VotesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/votes",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.index(request, h),
        options: {
            validate: {
                query: Joi.object({
                    ...server.app.schemas.transactionCriteriaSchemas,
                    orderBy: server.app.schemas.transactionsOrderBy,
                    transform: Joi.bool().default(true),
                })
                    .concat(transactionSortingSchema)
                    .concat(Schemas.pagination),
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
        path: "/votes/{id}",
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => controller.show(request, h),
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
