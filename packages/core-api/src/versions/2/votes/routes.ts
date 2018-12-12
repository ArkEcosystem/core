import Hapi from "hapi";
import { VotesController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new VotesController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/votes",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/votes/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
}
