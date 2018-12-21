import { Container } from "@arkecosystem/core-container";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "vote-report",
    async register(container: Container, options) {
        return startServer(options);
    },
    async deregister(container: Container, options) {
        return container.resolvePlugin("vote-report").stop();
    },
};
