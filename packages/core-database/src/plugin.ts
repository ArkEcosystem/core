import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { DatabaseManager } from "./manager";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "databaseManager",
    async register(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Starting Database Manager");

        return new DatabaseManager();
    },
};
