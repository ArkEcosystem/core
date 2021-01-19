import Hapi from "@hapi/hapi";
import Joi from "joi";

import { LogArchivedController } from "../controllers/log-archived";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(LogArchivedController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/log/archived/{id}",
        handler: controller.file,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
        },
    });
};
