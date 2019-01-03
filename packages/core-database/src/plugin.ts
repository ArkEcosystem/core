import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { DatabaseManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "databaseManager",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting Database Manager");

        return new DatabaseManager();
    },
};
