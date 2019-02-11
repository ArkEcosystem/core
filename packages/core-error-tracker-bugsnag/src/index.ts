import { Container } from "@arkecosystem/core-interfaces";
import bugsnag from "@bugsnag/js";
import { defaults } from "./defaults";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Container.IContainer, options) {
        return bugsnag(options);
    },
};
