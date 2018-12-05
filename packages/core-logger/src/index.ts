import { LoggerInterface } from "./interface";
import { LogManager } from "./manager";

exports.plugin = {
  pkg: require("../package.json"),
  alias: "logManager",
  async register() {
    return new LogManager();
  },
};

export { LoggerInterface };
