import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { defaults } from "./defaults";
import { PostgresConnection } from "./postgres-connection";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = this.app.resolve<ConnectionManager>("database-manager");
        const connection = await connectionManager.createConnection(new PostgresConnection(this.opts, walletManager));

        this.app.bind("database", databaseServiceFactory(this.opts, walletManager, connection));
    }

    public async dispose(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Closing Database Connection");

        await this.app.resolve<Contracts.Database.IDatabaseService>("database").connection.disconnect();
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
