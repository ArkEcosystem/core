import { Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Contracts.Kernel.IContainer, options) {
        return container.resolve<LoggerManager>("log-manager").createDriver(new WinstonLogger(options));
    },
};
