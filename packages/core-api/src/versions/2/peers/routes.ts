import Hapi from "hapi";
import Controller from "./controller";
import * as Schema from "./schema";

export default function(server: Hapi.Server): void {
  const controller = new Controller();
  server.bind(controller);

  server.route({
    method: "GET",
    path: "/peers",
    handler: controller.index,
    options: {
      validate: Schema.index,
    },
  });

  server.route({
    method: "GET",
    path: "/peers/suspended",
    handler: controller.suspended,
  });

  server.route({
    method: "GET",
    path: "/peers/{ip}",
    handler: controller.show,
    options: {
      validate: Schema.show,
    },
  });
}
