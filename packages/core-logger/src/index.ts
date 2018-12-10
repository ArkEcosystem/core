import { AbstractLogger } from "./logger";
import { LogManager } from "./manager";

const plugin = {
    pkg: require("../package.json"),
    alias: "logManager",
    async register() {
        return new LogManager();
    },
};

export { plugin, AbstractLogger };
