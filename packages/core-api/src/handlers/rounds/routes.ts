import Hapi from "@hapi/hapi";

import { RoundsController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(RoundsController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/rounds/{id}/delegates",
        handler: controller.delegates,
        options: {
            validate: Schema.delegates,
        },
    });
};
