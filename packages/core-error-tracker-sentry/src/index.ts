import { Container } from "@arkecosystem/core-interfaces";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Container.IContainer, options) {
        Sentry.init(options);

        return Sentry;
    },
};
