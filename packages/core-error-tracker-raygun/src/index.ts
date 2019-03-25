import { Container } from "@arkecosystem/core-interfaces";
import raygun from "raygun";
import { defaults } from "./defaults";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Container.IContainer, options) {
        return new raygun.Client().init(options);
    },
};
