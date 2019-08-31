import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";

import { PostgresConnection } from "./postgres-connection";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = this.app.get<ConnectionManager>(Container.Identifiers.DatabaseManager);
        const connection = await connectionManager.createConnection(
            new PostgresConnection(this.config().all(), walletManager),
        );

        this.app
            .bind(Container.Identifiers.DatabaseService)
            .toConstantValue(await databaseServiceFactory(this.config().all(), walletManager, connection));
    }

    public async dispose(): Promise<void> {
        this.app.log.info("Closing Database Connection");

        await this.app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .connection.disconnect();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
