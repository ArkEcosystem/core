import { Contracts } from "@arkecosystem/core-kernel";
import bugsnag, { Bugsnag } from "@bugsnag/js";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Contracts.Kernel.IContainer, options: Container.IPluginOptions) {
        if (!options.apiKey || typeof options.apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }
        return bugsnag(options as Bugsnag.IConfig);
    },
};
