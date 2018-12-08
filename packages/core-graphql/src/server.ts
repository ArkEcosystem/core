import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import server from "./schema";

export async function startServer(config) {
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
}
