import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";
import { getCustomRepository } from "typeorm";

import { SnapshotDatabaseService } from "./database-service";
import { Filesystem } from "./filesystem/filesystem";
import { Identifiers } from "./ioc";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { SnapshotService } from "./snapshot-service";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.SnapshotVersion).toConstantValue(this.version());

        this.registerServices();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    public dependencies(): Contracts.Kernel.PluginDependency[] {
        return [
            {
                name: "@arkecosystem/core-database",
                required: true,
            },
        ];
    }

    public configSchema(): object {
        return Joi.object({
            updateStep: Joi.number().integer().min(1).max(2000).required(),
            cryptoPackages: Joi.array().items(Joi.string()).required(),
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
}
