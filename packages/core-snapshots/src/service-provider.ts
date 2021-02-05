import { Models, Utils } from "@arkecosystem/core-database";
import { Container, Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";
import { Connection, createConnection, getCustomRepository } from "typeorm";

import { SnapshotDatabaseService } from "./database-service";
import { Filesystem } from "./filesystem/filesystem";
import { Identifiers } from "./ioc";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { SnapshotService } from "./snapshot-service";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.SnapshotVersion).toConstantValue(this.version());

        this.app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(await this.connect());

        this.registerServices();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Connection>(Identifiers.SnapshotDatabaseConnection).close();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    public configSchema(): object {
        return Joi.object({
            updateStep: Joi.number().required(),
            connection: Joi.object({
                type: Joi.string().required(),
                host: Joi.string().required(),
                port: Joi.number().required(),
                database: Joi.string().required(),
                username: Joi.string().required(),
                password: Joi.string().required(),
                entityPrefix: Joi.string().required(),
                synchronize: Joi.bool().required(),
                logging: Joi.bool().required(),
            }).required(),
            cryptoPackages: Joi.array()
                .items(
                    Joi.object({
                        typeGroup: Joi.number().min(2).required(),
                        packageName: Joi.string().required(),
                    }),
                )
                .required(),
        }).unknown(true);
    }

    private registerServices(): void {
        this.app.bind(Container.Identifiers.SnapshotService).to(SnapshotService).inSingletonScope();

        this.app.bind(Identifiers.SnapshotDatabaseService).to(SnapshotDatabaseService).inSingletonScope();

        this.app.bind(Identifiers.SnapshotFilesystem).to(Filesystem).inSingletonScope();

        this.app.bind(Identifiers.ProgressDispatcher).to(ProgressDispatcher).inTransientScope();

        this.app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(getCustomRepository(BlockRepository));
        this.app
            .bind(Identifiers.SnapshotTransactionRepository)
            .toConstantValue(getCustomRepository(TransactionRepository));
        this.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(getCustomRepository(RoundRepository));
    }

    private async connect(): Promise<Connection> {
        const options: Record<string, any> = this.config().all();

        if (this.app.isBound(Container.Identifiers.DatabaseConnection)) {
            options.connection.name = "snapshots_connection";
        }

        return createConnection({
            ...options.connection,
            namingStrategy: new Utils.SnakeNamingStrategy(),
            entities: [Models.Block, Models.Transaction, Models.Round],
        });
    }
}
