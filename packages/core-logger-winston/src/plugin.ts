import { Container } from "@arkecosystem/core-interfaces";
import { LogManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Container.IContainer, options) {
        const logManager: LogManager = container.resolvePlugin("logManager");
        await logManager.makeDriver(new WinstonLogger(options));

        return logManager.driver();
    },
};
