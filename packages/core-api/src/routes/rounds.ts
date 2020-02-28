import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { RoundsController } from "../controllers/rounds";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(RoundsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/rounds/{id}/delegates",
        handler: controller.delegates,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.number()
                        .integer()
                        .min(1),
                }),
            },
        },
    });
};
