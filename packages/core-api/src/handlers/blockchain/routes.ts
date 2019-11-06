import Hapi from "@hapi/hapi";

import { BlockchainController } from "./controller";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BlockchainController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blockchain",
        handler: controller.index,
    });
};
