import Hapi from "@hapi/hapi";
import { BridgechainController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new BridgechainController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/bridgechains",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "POST",
        path: "/bridgechains/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
