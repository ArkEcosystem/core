import Hapi from "@hapi/hapi";
import { BlocksController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new BlocksController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blocks",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/first",
        handler: controller.first,
        options: {
            validate: Schema.first,
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/last",
        handler: controller.last,
        options: {
            validate: Schema.last,
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "GET",
        path: "/blocks/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: Schema.transactions,
        },
    });

    server.route({
        method: "POST",
        path: "/blocks/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
