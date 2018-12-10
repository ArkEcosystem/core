import { config } from "./config";
import { defaults } from "./defaults";
import { monitor } from "./monitor";
import { startServer } from "./server";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: any = {
    pkg: require("../package.json"),
    defaults,
    alias: "p2p",
    async register(container, options) {
        container.resolvePlugin("logger").info("Starting P2P Interface");

        config.init(options);

        monitor.server = await startServer(options);

        await monitor.start(options);

        return monitor;
    },
    async deregister(container, options) {
        container.resolvePlugin("logger").info("Stopping P2P Interface");

        const p2p = container.resolvePlugin("p2p");
        p2p.dumpPeers();

        return p2p.server.stop();
    },
};
