import Hapi from "@hapi/hapi";

import { BlockchainController } from "../controllers/blockchain";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(BlockchainController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blockchain",
        handler: (request: Hapi.Request) => controller.index(request),
    });
};
