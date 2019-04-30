import Hapi from "@hapi/hapi";
import { RoundsController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new RoundsController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/rounds/{id}/delegates",
        handler: controller.delegates,
        options: {
            validate: Schema.delegates,
        },
    });
}
