import { Container } from "@arkecosystem/core-interfaces";
import newrelic from "newrelic";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    alias: "error-tracker",
    async register(container: Container.IContainer, options) {
        return newrelic;
    },
};
