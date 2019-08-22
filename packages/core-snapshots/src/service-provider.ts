import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.opts);

        const databaseService = this.app.resolve<Contracts.Database.IDatabaseService>("database");

        this.app.bind("snapshots", manager.make(databaseService.connection as PostgresConnection));
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public configDefaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["snapshots"];
    }
}
