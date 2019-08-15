import { Contracts } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    alias: "error-tracker",
    async register(container: Contracts.Kernel.IContainer, options) {
        return newrelic;
    },
};
