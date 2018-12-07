import Hapi from "hapi";
import Controller from "./controller";

export default function(server: Hapi.Server): void {
  const controller = new Controller();
  server.bind(controller);

  server.route({
    method: "GET",
    path: "/node/status",
    handler: controller.status,
  });

  server.route({
    method: "GET",
    path: "/node/syncing",
    handler: controller.syncing,
  });

  server.route({
    method: "GET",
    path: "/node/configuration",
    handler: controller.configuration,
  });
}
