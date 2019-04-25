import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { StateStorage } from "./state-storage";

/**
 * @TODO
 *
 * 1. Move the wallet manager into core-state as it only holds the in-memory state of wallets and doesn't
 * depend on the database even though it is in that package.
 *
 * 2. Seal the storage or make all props private
 *
 * 3. Implement https://github.com/ArkEcosystem/core/issues/2114
 */

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "state",
    async register(container: Container.IContainer) {
        container.resolvePlugin<Logger.ILogger>("logger").info("State initialised.");

        return new StateStorage();
    },
};
