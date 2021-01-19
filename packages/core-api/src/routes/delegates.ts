import Hapi from "@hapi/hapi";
import Joi from "joi";

import { DelegatesController } from "../controllers/delegates";
import {
    delegateCriteriaSchema,
    delegateSortingSchema,
    walletCriteriaSchema,
    walletParamSchema,
    walletSortingSchema,
} from "../resources-new";
import * as Schemas from "../schemas";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(DelegatesController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/delegates",
        handler: (request: Hapi.Request) => controller.index(request),
        options: {
            validate: {
                query: Joi.object()
                    .concat(delegateCriteriaSchema)
                    .concat(delegateSortingSchema)
                    .concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}",
        handler: (request: Hapi.Request) => controller.show(request),
        options: {
            validate: {
                params: Joi.object({
                    id: walletParamSchema,
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: (request: Hapi.Request) => controller.voters(request),
        options: {
            validate: {
                params: Joi.object({
                    id: walletParamSchema,
                }),
                query: Joi.object().concat(walletCriteriaSchema).concat(walletSortingSchema).concat(Schemas.pagination),
            },
            plugins: {
                pagination: { enabled: true },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/blocks",
        handler: (request: Hapi.Request) => controller.blocks(request),
        options: {
            validate: {
                params: Joi.object({
                    id: walletParamSchema,
                }),
                query: Joi.object({
                    ...server.app.schemas.blockCriteriaSchemas,
                    orderBy: server.app.schemas.blocksOrderBy,
                    transform: Joi.bool().default(true),
                }).concat(Schemas.pagination),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });
};
