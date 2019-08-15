import { Contracts } from "@arkecosystem/core-kernel";
import raygun from "raygun";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Contracts.Kernel.IContainer, options: Container.IPluginOptions) {
        return new raygun.Client().init((options as unknown) as raygun.raygun.RaygunOptions);
    },
};
