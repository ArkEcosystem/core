import Hapi from "@hapi/hapi";
import { LocksController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new LocksController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/locks",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/locks/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "POST",
        path: "/locks/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });

    server.route({
        method: "POST",
        path: "/locks/unlocked",
        handler: controller.unlocked,
        options: {
            validate: Schema.unlocked,
        },
    });
};
