import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Connection } from "typeorm";
import { Identifiers } from "./ioc";
import { SnapshotBlockRepository, SnapshotRoundRepository, SnapshotTransactionRepository } from "./repositories";

@Container.injectable()
export class SnapshotDatabaseService implements Contracts.Snapshot.DatabaseService {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    private readonly blockRepository!: SnapshotBlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly roundRepository!: SnapshotRoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly transactionRepository!: SnapshotTransactionRepository;

    public async truncate(): Promise<void> {
        this.logger.info("Running TRUNCATE method inside DatabaseService");

        this.logger.info(`Is database connected: ${this.connection.isConnected}`);

        this.logger.info(
            `Clearing:  ${await this.blockRepository.count()} blocks,  ${await this.transactionRepository.count()} transactions,  ${await this.roundRepository.count()} rounds.`,
        );

        await this.transactionRepository.clear();
        await this.roundRepository.clear();
        await this.blockRepository.delete({}); // Clear does't work on tables with relations
    }
}
