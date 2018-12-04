import { client } from "@arkecosystem/crypto";
import { configLoader } from "./loader";

export const plugin = {
  pkg: require("../package.json"),
  alias: "config",
  async register(container, options) {
    const config = await configLoader.setUp(options);

    client.setConfig(config.network);

    return config;
  },
};
