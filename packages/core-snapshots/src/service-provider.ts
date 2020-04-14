import { Container, Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { getCustomRepository } from "typeorm";
import { SnapshotService } from "./snapshot-service";
import { SnapshotDatabaseService } from "./database-service";
import { SnapshotBlockRepository, SnapshotRoundRepository, SnapshotTransactionRepository } from "./repositories";
import { Utils } from "./utils";
import { ProgressDispatcher } from "./progress-dispatcher";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerServices();
    }

    // public async dispose(): Promise<void> {
    // }

    public async required(): Promise<boolean> {
        return true;
    }

    private registerServices(): void {
        this.app.bind(Container.Identifiers.SnapshotService).to(SnapshotService).inSingletonScope();

        this.app.bind(Identifiers.SnapshotDatabaseService).to(SnapshotDatabaseService).inSingletonScope();

        this.app.bind(Identifiers.SnapshotUtils).to(Utils).inSingletonScope();

        this.app.bind(Identifiers.ProgressDispatcher).to(ProgressDispatcher);

        this.app
            .bind(Identifiers.SnapshotBlockRepository)
            .toConstantValue(getCustomRepository(SnapshotBlockRepository));
        this.app
            .bind(Identifiers.SnapshotTransactionRepository)
            .toConstantValue(getCustomRepository(SnapshotTransactionRepository));
        this.app
            .bind(Identifiers.SnapshotRoundRepository)
            .toConstantValue(getCustomRepository(SnapshotRoundRepository));
    }
}
