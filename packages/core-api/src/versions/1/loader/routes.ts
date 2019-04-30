import Hapi from "@hapi/hapi";
import { LoaderController } from "./controller";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new LoaderController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/loader/status",
        handler: controller.status,
    });

    server.route({
        method: "GET",
        path: "/loader/status/sync",
        handler: controller.syncing,
    });

    server.route({
        method: "GET",
        path: "/loader/autoconfigure",
        handler: controller.autoconfigure,
    });
}
