import { Contracts } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Contracts.Kernel.IContainer, options) {
        return new AirBrake(options);
    },
};
