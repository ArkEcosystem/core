import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import { config } from "./config";
import { TransactionPool } from "./connection";
import { defaults } from "./defaults";
import { transactionPoolManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        config.init(this.opts);

        this.app.resolve<Logger.ILogger>("logger").info("Connecting to transaction pool");

        await transactionPoolManager.makeConnection(new TransactionPool(this.opts));

        this.app.bind(this.getAlias(), transactionPoolManager.connection());
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.resolve<Logger.ILogger>("logger").info("Disconnecting from transaction pool");

        this.app.resolve(this.getAlias()).disconnect();
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }
}
