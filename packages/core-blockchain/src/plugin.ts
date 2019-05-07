import { Container } from "@arkecosystem/core-interfaces";
import { asValue } from "awilix";
import { Blockchain } from "./blockchain";
import { config } from "./config";
import { defaults } from "./defaults";
import { stateStorage } from "./state-storage";

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

        config.init(options);

        container.register("state", asValue(stateStorage));

        if (!process.env.CORE_SKIP_BLOCKCHAIN) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Container.IContainer, options) {
        await container.resolvePlugin<Blockchain>("blockchain").stop();
    },
};
