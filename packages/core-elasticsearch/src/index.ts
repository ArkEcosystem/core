import { AbstractServiceProvider } from "@arkecosystem/core-container";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { blockIndex } from "./index/block";
import { roundIndex } from "./index/round";
import { transactionIndex } from "./index/transaction";
import { walletIndex } from "./index/wallet";
import { startServer } from "./server";
import { client } from "./services/client";
import { storage } from "./services/storage";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logger = this.app.resolve<Logger.ILogger>("logger");

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
        this.app.resolve<Logger.ILogger>("logger").info("[Elasticsearch] Stopping API :warning:");

        return this.app.resolve("elasticsearch").stop();
    }

    public getAlias(): string {
        return "elasticsearch";
    }
}
