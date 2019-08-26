import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts, Support } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.config().all());

        const databaseService = this.ioc.get<Contracts.Database.IDatabaseService>("database");

        // Why is a builder pattern with a manager used?
        this.ioc.bind("snapshots").toConstantValue(manager.make(databaseService.connection as PostgresConnection));
    }
}
