import Hapi from "@hapi/hapi";
import { PeersController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new PeersController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/peers",
        handler: controller.index,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getPeers,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/peers/get",
        handler: controller.show,
        options: {
            plugins: {
                "hapi-ajv": {
                    querySchema: Schema.getPeer,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/peers/version",
        handler: controller.version,
    });
};
