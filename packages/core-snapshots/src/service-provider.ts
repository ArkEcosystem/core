import { Container, Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { getCustomRepository, createConnection, Connection } from "typeorm";
import { SnapshotService } from "./snapshot-service";
import { SnapshotDatabaseService } from "./database-service";
import { SnapshotBlockRepository, SnapshotRoundRepository, SnapshotTransactionRepository } from "./repositories";
import { Utils } from "./utils";
import { ProgressDispatcher } from "./progress-dispatcher";
import { Models } from "@arkecosystem/core-database";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(await this.connect());

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

    private async connect(): Promise<Connection> {
        const options: Record<string, any> = this.config().all();

        console.log("Snapshot options: ", options);
        // this.app
        //     .get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService)
        //     .dispatch(DatabaseEvent.PRE_CONNECT);

        return createConnection({
            ...options.connection,
            namingStrategy: new Models.SnakeNamingStrategy(),
            // migrations: [__dirname + "/migrations/*.js"],
            // migrationsRun: false,
            // entities: [__dirname + "/models/*.js"],
            entities: [Models.Block, Models.Transaction, Models.Round],
        });
    }
}
