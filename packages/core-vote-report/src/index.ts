import { Container } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "vote-report",
    async register(container: Container.Container, options) {
        return startServer(options);
    },
    async deregister(container: Container.Container, options) {
        return container.resolvePlugin("vote-report").stop();
    },
};
