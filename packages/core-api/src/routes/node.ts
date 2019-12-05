import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { NodeController } from "../controllers/node";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(NodeController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/node/status",
        handler: controller.status,
    });

    server.route({
        method: "GET",
        path: "/node/syncing",
        handler: controller.syncing,
    });

    server.route({
        method: "GET",
        path: "/node/configuration",
        handler: controller.configuration,
    });

    server.route({
        method: "GET",
        path: "/node/configuration/crypto",
        handler: controller.configurationCrypto,
    });

    server.route({
        method: "GET",
        path: "/node/fees",
        handler: controller.fees,
        options: {
            validate: {
                query: Joi.object({
                    days: Joi.number()
                        .integer()
                        .min(1)
                        .max(30)
                        .default(7),
                }),
            },
        },
    });
};
