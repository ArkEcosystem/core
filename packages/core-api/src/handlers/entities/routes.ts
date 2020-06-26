import Hapi from "@hapi/hapi";
import { EntityController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new EntityController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/entities",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/entities/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "POST",
        path: "/entities/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
