import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { SnapshotDatabaseService } from "./database-service";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class SnapshotService implements Contracts.Snapshot.SnapshotService {
    // @Container.inject(Container.Identifiers.Application)
    // private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotDatabaseService)
    // private readonly database!: Contracts.Snapshot.DatabaseService;
    private readonly database!: SnapshotDatabaseService;

    public async dump(): Promise<void> {
        this.logger.info("Running DUMP method inside SnapshotService");
    }

    public async restore(): Promise<void> {
        this.logger.info("Running RESTORE method inside SnapshotService");
    }

    public async rollbackByHeight(height: number, backupTransactions: boolean): Promise<void> {
        this.logger.info("Running ROLLBACK by Height method inside SnapshotService");

        if (!height || height <= 0) {
            this.logger.error(`Rollback height ${height.toLocaleString()} is invalid.`);
            // TODO: Throw error
            throw new Error();
        }

        const lastBlock = await this.database.getLastBlock();

        Utils.assert.defined<Interfaces.IBlock>(lastBlock);

        const currentHeight = lastBlock.data.height;

        if (height >= currentHeight) {
            this.logger.error(`Rollback height ${height.toLocaleString()} is greater than the current height ${currentHeight.toLocaleString()}.`);
            // TODO: Throw error
            throw new Error();
        }

        const roundInfo = Utils.roundCalculator.calculateRound(height);

        let newLastBlock = await this.database.rollbackChain(roundInfo);

        Utils.assert.defined<Interfaces.IBlock>(newLastBlock);

        this.logger.info(
            `Rolling back chain to last finished round ${roundInfo.round.toLocaleString()} with last block height ${newLastBlock.data.height.toLocaleString()}`,
        );
    }

    public async rollbackByNumber(number: number, backupTransactions: boolean): Promise<void> {
        this.logger.info("Running ROLLBACK by Number method inside SnapshotService");

        const lastBlock = await this.database.getLastBlock();

        return this.rollbackByHeight(lastBlock.data.height - number, backupTransactions);
    }

    public async truncate(): Promise<void> {
        this.logger.info("Running TRUNCATE method inside SnapshotService");

        await this.database.truncate();
    }

    public async verify(): Promise<void> {
        this.logger.info("Running VERIFY method inside SnapshotService");
    }

    public async test(): Promise<void> {
        this.logger.info("Running TEST method inside SnapshotService");
        await this.database.test();
    }
}
