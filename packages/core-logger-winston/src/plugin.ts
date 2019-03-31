import { Container } from "@arkecosystem/core-interfaces";
import { LoggerManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Container.IContainer, options) {
        return container.resolvePlugin<LoggerManager>("log-manager").makeDriver(new WinstonLogger(options));
    },
};
