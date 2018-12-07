import Hapi from "hapi";
import Controller from "./controller";

export default function(server: Hapi.Server): void {
  const controller = new Controller();
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
