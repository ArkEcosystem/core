import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";
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
import { WalletsTableService } from "./wallets-table-service";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logger: Contracts.Kernel.Logger = this.app.get(Container.Identifiers.LogService);

        logger.info("Connecting to database: " + (this.config().all().connection as any).database);

        this.app
            .bind(Container.Identifiers.DatabaseConnection)
            .toConstantValue(await this.connect())
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "default"));
        this.app
            .bind(Container.Identifiers.DatabaseConnection)
            .toConstantValue(
                await this.connect("api", {
                    options: `-c statement_timeout=${this.config().getRequired("apiConnectionTimeout")}ms`,
                }),
            )
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "api"));

        logger.debug("Connection established.");

        this.app
            .bind(Container.Identifiers.DatabaseRoundRepository)
            .toConstantValue(this.getRoundRepository())
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "default"));
        this.app
            .bind(Container.Identifiers.DatabaseRoundRepository)
            .toConstantValue(this.getRoundRepository("api"))
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "api"));

        this.app
            .bind(Container.Identifiers.DatabaseBlockRepository)
            .toConstantValue(this.getBlockRepository())
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "default"));
        this.app
            .bind(Container.Identifiers.DatabaseBlockRepository)
            .toConstantValue(this.getBlockRepository("api"))
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "api"));

        this.app.bind(Container.Identifiers.DatabaseBlockFilter).to(BlockFilter);
        this.app.bind(Container.Identifiers.BlockHistoryService).to(BlockHistoryService);

        this.app
            .bind(Container.Identifiers.DatabaseTransactionRepository)
            .toConstantValue(this.getTransactionRepository())
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "default"));
        this.app
            .bind(Container.Identifiers.DatabaseTransactionRepository)
            .toConstantValue(this.getTransactionRepository("api"))
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("connection", "api"));

        this.app.bind(Container.Identifiers.DatabaseTransactionFilter).to(TransactionFilter);
        this.app.bind(Container.Identifiers.TransactionHistoryService).to(TransactionHistoryService);

        this.app.bind(Container.Identifiers.DatabaseModelConverter).to(ModelConverter);
        this.app.bind(Container.Identifiers.DatabaseService).to(DatabaseService).inSingletonScope();
        this.app.bind(Container.Identifiers.DatabaseWalletsTableService).to(WalletsTableService);
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

    public async connect(connectionName = "default", extra = {}): Promise<Connection> {
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
            name: connectionName,
            namingStrategy: new SnakeNamingStrategy(),
            migrations: [__dirname + "/migrations/*.js"],
            migrationsRun: connectionName === "default",
            extra,
            // TODO: expose entities to allow extending the models by plugins
            entities: [__dirname + "/models/*.js"],
        });
    }

    public getRoundRepository(connectionName = "default"): RoundRepository {
        return getCustomRepository(RoundRepository, connectionName);
    }

    public getBlockRepository(connectionName = "default"): BlockRepository {
        return getCustomRepository(BlockRepository, connectionName);
    }

    public getTransactionRepository(connectionName = "default"): TransactionRepository {
        return getCustomRepository(TransactionRepository, connectionName);
    }

    public configSchema(): object {
        return Joi.object({
            connection: Joi.object({
                type: Joi.string().required(),
                host: Joi.string().required(),
                port: Joi.number().integer().min(1).max(65535).required(),
                database: Joi.string().required(),
                username: Joi.string().required(),
                password: Joi.string().required(),
                entityPrefix: Joi.string().required(),
                synchronize: Joi.bool().required(),
                logging: Joi.bool().required(),
            }).required(),
            apiConnectionTimeout: Joi.number().integer().min(1).required(),
        }).unknown(true);
    }
}
