import { app, Contracts } from "@arkecosystem/core-kernel";
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
    async register(container: Contracts.Kernel.IContainer, options: Container.IPluginOptions) {
        let blockchain: Blockchain;

        if (options.replay) {
            blockchain = new ReplayBlockchain();
        } else {
            blockchain = new Blockchain(options);
        }

        container
            .resolve<Contracts.State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !options.replay) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Contracts.Kernel.IContainer) {
        await container.resolve<Blockchain>("blockchain").stop();
    },
};
