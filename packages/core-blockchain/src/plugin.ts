import { Container, State } from "@arkecosystem/core-interfaces";
import { Blockchain } from "./blockchain";
import { defaults } from "./defaults";
import { blockchainMachine } from "./machines/blockchain";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "blockchain",
    async register(container: Container.IContainer, options: Container.IPluginOptions) {
        const blockchain = new Blockchain(options);

        container
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Container.IContainer) {
        await container.resolvePlugin<Blockchain>("blockchain").stop();
    },
};
