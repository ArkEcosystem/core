import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";

@Container.injectable()
export class SnapshotService implements Contracts.Snapshot.SnapshotService {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotDatabaseService)
    private readonly database!: Contracts.Snapshot.DatabaseService;

    public async dump(): Promise<void> {
        this.logger.info("Running DUMP method inside SnapshotService");
    }

    public async restore(): Promise<void> {
        this.logger.info("Running RESTORE method inside SnapshotService");
    }

    public async rollback(): Promise<void> {
        this.logger.info("Running ROLLBACK method inside SnapshotService");
    }

    public async truncate(): Promise<void> {
        this.logger.info("Running TRUNCATE method inside SnapshotService");

        await this.database.truncate();
    }

    public async verify(): Promise<void> {
        this.logger.info("Running VERIFY method inside SnapshotService");
    }
}
