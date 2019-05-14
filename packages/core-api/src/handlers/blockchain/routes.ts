import Hapi from "@hapi/hapi";
import { BlockchainController } from "./controller";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new BlockchainController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/blockchain",
        handler: controller.index,
    });
};
