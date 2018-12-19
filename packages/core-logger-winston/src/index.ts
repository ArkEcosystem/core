import { LogManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { Logger } from "./driver";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container, options) {
        const logManager: LogManager = container.resolvePlugin("logManager");
        await logManager.makeDriver(new Logger(options));

        return logManager.driver();
    },
};
