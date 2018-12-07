import Hapi from "hapi";
import Controller from "./controller";

export default function(server: Hapi.Server): void {
  const controller = new Controller();
  server.bind(controller);

  server.route({
    method: "GET",
    path: "/signatures/fee",
    handler: controller.fee,
  });
}
