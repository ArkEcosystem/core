import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { monitor, Monitor } from "./monitor";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.logger.info("Starting P2P Interface");

        monitor.server = await startServer(this.opts);

        await monitor.start(this.opts);

        this.app.bind(this.getAlias(), monitor);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.logger.info("Stopping P2P Interface");

        const p2p = this.app.resolve<Monitor>(this.getAlias());
        p2p.dumpPeers();

        return p2p.server.stop();
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
