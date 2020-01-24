import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Connection, createConnection, getCustomRepository } from "typeorm";

import { DatabaseService } from "./database-service";
import { DatabaseEvent } from "./events";
import { SnakeNamingStrategy } from "./models/naming-strategy";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Connecting to database: " + (this.config().all().connection as any).database);

        this.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(await this.connect());

        this.app.log.debug("Connection established.");

        this.app.bind(Container.Identifiers.BlockRepository).toConstantValue(getCustomRepository(BlockRepository));

        const transactionRepository: TransactionRepository = getCustomRepository(TransactionRepository);
        transactionRepository.getWalletRepository = () => {
            // Inversify isn't responsible for the instance creation so we can't inject.
            return this.app.getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");
        };
        this.app.bind(Container.Identifiers.TransactionRepository).toConstantValue(transactionRepository);

        this.app.bind(Container.Identifiers.RoundRepository).toConstantValue(getCustomRepository(RoundRepository));

        this.app
            .bind(Container.Identifiers.DatabaseService)
            .to(DatabaseService)
            .inSingletonScope();
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

    private async connect(): Promise<Connection> {
        const options: Record<string, any> = this.config().all();
        this.app
            .get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService)
            .dispatch(DatabaseEvent.PRE_CONNECT);

        return createConnection({
            ...options.connection,
            namingStrategy: new SnakeNamingStrategy(),
            migrations: [__dirname + "/migrations/*.js"],
            migrationsRun: true,
            // TODO: expose entities to allow extending the models by plugins
            entities: [__dirname + "/models/*.js"],
        });
    }
}
