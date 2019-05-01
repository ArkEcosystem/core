import { Container } from "@arkecosystem/core-interfaces";
import AirBrake from "airbrake-js";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Container.IContainer, options) {
        return new AirBrake(options);
    },
};
