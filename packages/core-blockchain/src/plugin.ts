import { Container, State } from "@arkecosystem/core-interfaces";
import { Blockchain } from "./blockchain";
import { defaults } from "./defaults";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "blockchain",
    async register(container: Container.IContainer, options: Container.IPluginOptions) {
        let blockchain: Blockchain;

        if (options.replay) {
            blockchain = new ReplayBlockchain();
        } else {
            blockchain = new Blockchain(options);
        }

        container
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !options.replay) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Container.IContainer) {
        await container.resolvePlugin<Blockchain>("blockchain").stop();
    },
};
