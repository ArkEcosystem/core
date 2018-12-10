import { defaults } from "./defaults";
import { Logger } from "./driver";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container, options) {
        const logManager = container.resolvePlugin("logManager");
        // @ts-ignore
        await logManager.makeDriver(new Logger(options));

        return logManager.driver();
    },
};
