import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { SnapshotManager } from "./manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.config().all());

        const databaseService = this.app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);

        // Why is a builder pattern with a manager used?
        this.app.bind("snapshots").toConstantValue(manager.make(databaseService.connection as PostgresConnection));
    }
}
