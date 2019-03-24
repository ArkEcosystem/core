import { LogManager } from "./manager";

export const plugin = {
    pkg: require("../package.json"),
    alias: "log-manager",
    async register() {
        return new LogManager();
    },
};
