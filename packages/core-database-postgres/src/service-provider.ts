import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { PostgresConnection } from "./postgres-connection";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = this.app.resolve<ConnectionManager>("databaseManager");
        const connection = await connectionManager.createConnection(
            new PostgresConnection(this.config().all(), walletManager),
        );

        this.app.bind("database", await databaseServiceFactory(this.config().all(), walletManager, connection));
    }

    public async dispose(): Promise<void> {
        this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Closing Database Connection");

        await this.app.resolve<Contracts.Database.IDatabaseService>("database").connection.disconnect();
    }

    public provides(): string[] {
        return ["database"];
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
