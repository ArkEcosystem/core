import { Container }  from "@arkecosystem/core-container";
import { asValue } from "awilix";
import { Blockchain } from "./blockchain";
import { config } from "./config";
import { defaults } from "./defaults";
import { stateStorage } from "./state-storage";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "blockchain",
    async register(container: Container, options) {
        const blockchain = new Blockchain(options);

        config.init(options);

        container.register("state", asValue(stateStorage));

        if (!process.env.ARK_SKIP_BLOCKCHAIN) {
            await blockchain.start();
        }

        return blockchain;
    },
    async deregister(container: Container, options) {
        await container.resolvePlugin("blockchain").stop();
    },
};

/**
 * Access to the state.
 * @type {StateStorage}
 */
export { stateStorage };
