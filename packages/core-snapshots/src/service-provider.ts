import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts, Support } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.config().all());

        const databaseService = this.app.resolve<Contracts.Database.IDatabaseService>("database");

        this.app.bind("snapshots", manager.make(databaseService.connection as PostgresConnection));
    }

    public provides(): string[] {
        return ["snapshots"];
    }
}
