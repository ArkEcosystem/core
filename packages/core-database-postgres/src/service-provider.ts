import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { PostgresConnection } from "./postgres-connection";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Contracts.Kernel.Log.Logger>("log").info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = this.app.get<ConnectionManager>("databaseManager");
        const connection = await connectionManager.createConnection(
            new PostgresConnection(this.config().all(), walletManager),
        );

        this.app
            .bind("database")
            .toConstantValue(await databaseServiceFactory(this.config().all(), walletManager, connection));
    }

    public async dispose(): Promise<void> {
        this.app.get<Contracts.Kernel.Log.Logger>("log").info("Closing Database Connection");

        await this.app.get<Contracts.Database.DatabaseService>("database").connection.disconnect();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
