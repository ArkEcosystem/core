import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Connection, createConnection, getCustomRepository } from "typeorm";

import { BlockFilter } from "./block-filter";
import { BlockHistoryService } from "./block-history-service";
import { DatabaseService } from "./database-service";
import { DatabaseEvent } from "./events";
import { ModelConverter } from "./model-converter";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { TransactionFilter } from "./transaction-filter";
import { TransactionHistoryService } from "./transaction-history-service";
import { SnakeNamingStrategy } from "./utils/snake-naming-strategy";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logger: Contracts.Kernel.Logger = this.app.get(Container.Identifiers.LogService);

        logger.info("Connecting to database: " + (this.config().all().connection as any).database);

        this.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(await this.connect());

        logger.debug("Connection established.");

        this.app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(this.getRoundRepository());

        this.app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(this.getBlockRepository());
        this.app.bind(Container.Identifiers.DatabaseBlockFilter).to(BlockFilter);
        this.app.bind(Container.Identifiers.BlockHistoryService).to(BlockHistoryService);

        this.app
            .bind(Container.Identifiers.DatabaseTransactionRepository)
            .toConstantValue(this.getTransactionRepository());
        this.app.bind(Container.Identifiers.DatabaseTransactionFilter).to(TransactionFilter);
        this.app.bind(Container.Identifiers.TransactionHistoryService).to(TransactionHistoryService);

        this.app.bind(Container.Identifiers.DatabaseModelConverter).to(ModelConverter);
        this.app.bind(Container.Identifiers.DatabaseService).to(DatabaseService).inSingletonScope();
    }

    public async boot(): Promise<void> {
        await this.app.get<DatabaseService>(Container.Identifiers.DatabaseService).initialize();
    }

    public async dispose(): Promise<void> {
        await this.app.get<DatabaseService>(Container.Identifiers.DatabaseService).disconnect();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    public async connect(): Promise<Connection> {
        const connection: Record<string, any> = this.config().all().connection as any;
        this.app
            .get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService)
            .dispatch(DatabaseEvent.PRE_CONNECT);

        if (this.app.isBound(Container.Identifiers.DatabaseLogger)) {
            connection.logging = "all";
            connection.logger = this.app.get(Container.Identifiers.DatabaseLogger);
        }

        return createConnection({
            ...(connection as any),
            namingStrategy: new SnakeNamingStrategy(),
            migrations: [__dirname + "/migrations/*.js"],
            migrationsRun: true,
            // TODO: expose entities to allow extending the models by plugins
            entities: [__dirname + "/models/*.js"],
        });
    }

    public getRoundRepository(): RoundRepository {
        return getCustomRepository(RoundRepository);
    }

    public getBlockRepository(): BlockRepository {
        return getCustomRepository(BlockRepository);
    }

    public getTransactionRepository(): TransactionRepository {
        return getCustomRepository(TransactionRepository);
    }
}
