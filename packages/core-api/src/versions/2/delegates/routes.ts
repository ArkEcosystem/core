import Hapi from "@hapi/hapi";
import { DelegatesController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new DelegatesController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/delegates",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/blocks",
        handler: controller.blocks,
        options: {
            validate: Schema.blocks,
        },
    });

    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: controller.voters,
        options: {
            validate: Schema.voters,
        },
    });

    server.route({
        method: "POST",
        path: "/delegates/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
}
