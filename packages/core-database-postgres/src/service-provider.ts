import { DatabaseManager } from "@arkecosystem/core-database";
import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import { PostgresConnection } from "./connection";
import { defaults } from "./defaults";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.resolve<Logger.ILogger>("logger").info("Establishing Database Connection");

        const databaseManager = this.app.resolve<DatabaseManager>("databaseManager");

        const connection = await databaseManager.makeConnection(new PostgresConnection(this.opts));

        this.app.bind(this.getAlias(), connection);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.resolve<Logger.ILogger>("logger").info("Closing Database Connection");

        return this.app.resolve<PostgresConnection>(this.getAlias()).disconnect();
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }
}
