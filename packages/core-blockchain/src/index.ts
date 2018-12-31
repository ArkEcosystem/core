import { Blockchain, Container } from "@arkecosystem/core-interfaces";
import { asValue } from "awilix";
import { BlockchainImpl } from "./blockchain";
import { config } from "./config";
import { defaults } from "./defaults";
import { stateStorage } from "./state-storage";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "blockchain",
    async register(container: Container.Container, options) {
        const blockchain = new BlockchainImpl(options);

        config.init(options);

        container.register("state", asValue(stateStorage));

        if (!process.env.ARK_SKIP_BLOCKCHAIN) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Container.Container, options) {
        await container.resolvePlugin<Blockchain.Blockchain>("blockchain").stop();
    },
};

/**
 * Access to the state.
 * @type {StateStorage}
 */
export { stateStorage };
