import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "vote-report",
    async register(container, options) {
        return startServer(options);
    },
    async deregister(container, options) {
        return container.resolvePlugin("vote-report").stop();
    },
};
