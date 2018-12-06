import {
  createServer,
  mountServer,
  plugins,
} from "@arkecosystem/core-http-utils";
import { routePlugin } from "./routes";

/**
 * Creates a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
    routes: {
      validate: {
        async failAction(request, h, err) {
          throw err;
        },
      },
    },
  });

  await server.register({
    plugin: plugins.whitelist,
    options: {
      whitelist: config.whitelist,
      name: "Elasticsearch API",
    },
  });

  await server.register(routePlugin);

  return mountServer("Elasticsearch API", server);
};
