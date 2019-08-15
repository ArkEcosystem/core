import { Contracts } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Contracts.Kernel.IContainer, options) {
        Sentry.init(options);

        return Sentry;
    },
};
