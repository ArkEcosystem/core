import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { SnapshotDatabaseService } from "./database-service";
import { Interfaces } from "@arkecosystem/crypto";
import { Utils as SnapshotUtils } from "./utils";
import { Meta } from "./contracts";

@Container.injectable()
export class SnapshotService implements Contracts.Snapshot.SnapshotService {
    @Container.inject(Identifiers.SnapshotUtils)
    private readonly utils!: SnapshotUtils;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotDatabaseService)
    // private readonly database!: Contracts.Snapshot.DatabaseService;
    private readonly database!: SnapshotDatabaseService;

    public async dump(options: any): Promise<void> {
        Utils.assert.defined<string>(options.network);

        this.utils.setNetwork(options.network);

        this.logger.info(`Running DUMP for network: ${options.network}`);

        await this.database.dump();

        this.logger.info(`Snapshot is saved on location: ${this.utils.getSnapshotFolderPath()}`);
    }

    public async restore(options: any): Promise<void> {
        Utils.assert.defined<string>(options.network);
        Utils.assert.defined<string>(options.blocks);

        this.utils.setNetwork(options.network);
        this.utils.setSnapshot(options.blocks);

        if (! await this.utils.snapshotExists()) {
            this.logger.error(`Snapshot ${options.blocks} of network ${options.network} does not exist.`);
            return;
        }

        let meta: Meta.MetaData;
        try {
            meta = await this.utils.readMetaData();
        } catch (e) {
            this.logger.error(`Metadata for snapshot ${options.blocks} of network ${options.network} is not valid.`);
        }

        this.logger.info(`Running RESTORE for network: ${options.network}`);

        await this.database.restore(meta!);

        this.logger.info(`Successfully restore  ${meta!.blocks.count} blocks, ${meta!.transactions.count} transactions, ${meta!.rounds.count} rounds`);
    }

    public async verify(options: any): Promise<void> {
        Utils.assert.defined<string>(options.network);
        Utils.assert.defined<string>(options.blocks);

        this.utils.setNetwork(options.network);
        this.utils.setSnapshot(options.blocks);

        if (!await this.utils.snapshotExists()) {
            this.logger.error(`Snapshot ${options.blocks} of network ${options.network} does not exist.`);
            return;
        }

        let meta: Meta.MetaData;
        try {
            meta = await this.utils.readMetaData();
        } catch (e) {
            this.logger.error(`Metadata for snapshot ${options.blocks} of network ${options.network} is not valid.`);
        }

        try {
            await this.database.verify(meta!);
            this.logger.info((`Snapshot ${options.blocks} of network ${options.network} is successfully verified.`));
        } catch (e) {
            this.logger.error(`Snapshot ${options.blocks} of network ${options.network} is not successfully verified.`);
        }
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


    public async test(options: any): Promise<void> {
        this.utils.setNetwork(options.network);
        this.utils.setSnapshot("1-222");
        this.logger.info("Running TEST method inside SnapshotService");
        await this.database.test(options);
    }
}
