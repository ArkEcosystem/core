import { Container, Logger } from "@arkecosystem/core-interfaces";
import { config } from "./config";
import { defaults } from "./defaults";
import { monitor, Monitor } from "./monitor";
import { startServer } from "./server";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "p2p",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting P2P Interface");

        config.init(options);

        monitor.server = await startServer(options);

        await monitor.start(options);

        return monitor;
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping P2P Interface");

        const p2p = container.resolvePlugin<Monitor>("p2p");
        p2p.cachePeers();

        return p2p.server.stop();
    },
};
