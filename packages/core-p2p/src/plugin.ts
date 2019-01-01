import { Container, Logger } from "@arkecosystem/core-interfaces";
import { config } from "./config";
import { defaults } from "./defaults";
import { monitor, MonitorImpl } from "./monitor";
import { startServer } from "./server";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "p2p",
    async register(container: Container.Container, options) {
        container.resolvePlugin<Logger.Logger>("logger").info("Starting P2P Interface");

        config.init(options);

        monitor.server = await startServer(options);

        await monitor.start(options);

        return monitor;
    },
    async deregister(container: Container.Container, options) {
        container.resolvePlugin<Logger.Logger>("logger").info("Stopping P2P Interface");

        const p2p = container.resolvePlugin<MonitorImpl>("p2p");
        p2p.dumpPeers();

        return p2p.server.stop();
    },
};
