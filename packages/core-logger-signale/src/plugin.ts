import { Container } from "@arkecosystem/core-interfaces";
import { LoggerManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { SignaleLogger } from "./driver";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Container.IContainer, options) {
        return container.resolvePlugin<LoggerManager>("log-manager").createDriver(new SignaleLogger(options));
    },
};
