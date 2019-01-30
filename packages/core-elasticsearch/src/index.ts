import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { blockIndex } from "./index/block";
import { roundIndex } from "./index/round";
import { transactionIndex } from "./index/transaction";
import { walletIndex } from "./index/wallet";
import { startServer } from "./server";
import { client } from "./services/client";
import { storage } from "./services/storage";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logger = this.app.logger;

        logger.info("[Elasticsearch] Initialising History :hourglass:");
        storage.ensure("history");

        logger.info("[Elasticsearch] Initialising Client :joystick:");
        await client.setUp(this.opts.client);

        blockIndex.setUp(this.opts.chunkSize);
        transactionIndex.setUp(this.opts.chunkSize);
        walletIndex.setUp(this.opts.chunkSize);
        roundIndex.setUp(this.opts.chunkSize);

        return startServer(this.opts.server);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.logger.info("[Elasticsearch] Stopping API :warning:");

        return this.app.resolve("elasticsearch").stop();
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
