import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import * as Handlebars from "handlebars";

export async function startServer(config) {
  const server = await createServer(
    {
      host: config.host,
      port: config.port,
    },
    (instance) =>
      instance.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: "templates",
      }),
  );

  server.route({
    method: "GET",
    path: "/",
    handler: require("./handler"),
  });

  return mountServer("Vote Report", server);
}
