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
}
