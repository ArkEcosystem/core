import { defaults } from "./defaults";
import { startServer } from "./server";
import { database } from "./server/services/database";

export const plugin = {
  pkg: require("../package.json"),
  defaults,
  alias: "json-rpc",
  async register(container, options) {
    const logger = container.resolvePlugin("logger");

    if (!options.enabled) {
      logger.info("JSON-RPC Server is disabled :grey_exclamation:");

      return;
    }

    database.init(options.database);

    return startServer(options);
  },
  async deregister(container, options) {
    if (options.enabled) {
      container.resolvePlugin("logger").info("Stopping JSON-RPC Server");

      return container.resolvePlugin("json-rpc").stop();
    }
  },
};
