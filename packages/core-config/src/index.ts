import { configLoader } from "./loader";

export const plugin = {
  pkg: require("../package.json"),
  alias: "config",
  async register(container, options) {
    return configLoader.setUp(options);
  },
};
