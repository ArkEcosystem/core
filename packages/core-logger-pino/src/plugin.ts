import { Container } from "@arkecosystem/core-interfaces";
import { LogManager } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { PinoLogger } from "./driver";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Container.IContainer, options) {
        return container.resolvePlugin<LogManager>("log-manager").makeDriver(new PinoLogger(options));
    },
};
