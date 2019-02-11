import Hapi from "hapi";
import { SignaturesController } from "./controller";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new SignaturesController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/signatures/fee",
        handler: controller.fee,
    });
}
