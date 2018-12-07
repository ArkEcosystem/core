import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import server from "./schema";

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
export default async (config) => {
  const app = await createServer({
    host: config.host,
    port: config.port,
  });

  await server.applyMiddleware({
    app,
    path: config.path,
  });

  await server.installSubscriptionHandlers(app.listener);

  return mountServer("GraphQL", app);
};
