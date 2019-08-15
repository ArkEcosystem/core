import { Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { PinoLogger } from "./driver";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container: Contracts.Kernel.IContainer, options) {
        return container.resolve<LoggerManager>("log-manager").createDriver(new PinoLogger(options));
    },
};
