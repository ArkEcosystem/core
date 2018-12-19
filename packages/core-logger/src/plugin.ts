import { LogManager } from "./manager";

export const plugin = {
    pkg: require("../package.json"),
    alias: "logManager",
    async register() {
        return new LogManager();
    },
};
