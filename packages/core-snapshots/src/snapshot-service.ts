import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Database, Meta } from "./contracts";
import { Filesystem } from "./filesystem/filesystem";
import { Identifiers } from "./ioc";

@Container.injectable()
export class SnapshotService implements Contracts.Snapshot.SnapshotService {
    @Container.inject(Identifiers.SnapshotFilesystem)
    private readonly filesystem!: Filesystem;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotDatabaseService)
    private readonly database!: Database.DatabaseService;

    public async dump(options: Contracts.Snapshot.DumpOptions): Promise<void> {
        try {
            Utils.assert.defined<string>(options.network);

            this.logger.info(`Running DUMP for network: ${options.network}`);

            this.database.init(options.codec, options.skipCompression);

            await this.database.dump(options);

            this.logger.info(`Snapshot is saved on location: ${this.filesystem.getSnapshotPath()}`);
        } catch (err) {
            this.logger.error(`DUMP failed`);
            this.logger.error(err.stack);
        }
    }

    public async restore(options: Contracts.Snapshot.RestoreOptions): Promise<void> {
        try {
            Utils.assert.defined<string>(options.network);
            Utils.assert.defined<string>(options.blocks);

            this.filesystem.setSnapshot(options.blocks);

            if (!(await this.filesystem.snapshotExists())) {
                this.logger.error(`Snapshot ${options.blocks} of network ${options.network} does not exist.`);
                return;
            }

            let meta: Meta.MetaData;
            try {
                meta = await this.filesystem.readMetaData();
            } catch (e) {
                this.logger.error(
                    `Metadata for snapshot ${options.blocks} of network ${options.network} are not valid.`,
                );
                return;
            }

            this.logger.info(`Running RESTORE for network: ${options.network}`);

            this.database.init(meta!.codec, meta!.skipCompression, options.verify);

            await this.database.restore(meta!, { truncate: !!options.truncate });

            this.logger.info(
                `Successfully restore  ${Utils.pluralize("block", meta!.blocks.count, true)}, ${Utils.pluralize(
                    "transaction",
                    meta!.transactions.count,
                    true,
                )}, ${Utils.pluralize("round", meta!.rounds.count, true)}`,
            );
        } catch (err) {
            this.logger.error(`RESTORE failed.`);
        }
    }

    public async verify(options: Contracts.Snapshot.RestoreOptions): Promise<void> {
        try {
            this.logger.info("Running VERIFICATION");

            Utils.assert.defined<string>(options.network);
            Utils.assert.defined<string>(options.blocks);

            this.filesystem.setSnapshot(options.blocks);

            if (!(await this.filesystem.snapshotExists())) {
                this.logger.error(`Snapshot ${options.blocks} of network ${options.network} does not exist.`);
                return;
            }

            let meta: Meta.MetaData;
            try {
                meta = await this.filesystem.readMetaData();
            } catch (e) {
                this.logger.error(
                    `Metadata for snapshot ${options.blocks} of network ${options.network} are not valid.`,
                );
            }

            this.database.init(meta!.codec, meta!.skipCompression);

            await this.database.verify(meta!);
            this.logger.info(`VERIFICATION is successful.`);
        } catch (err) {
            this.logger.error(`VERIFICATION failed.`);
            this.logger.error(err.stack);
        }
    }

    public async rollbackByHeight(height: number): Promise<void> {
        try {
            this.logger.info("Running ROLLBACK");

            if (!height || height <= 0) {
                this.logger.error(`Rollback height ${height.toLocaleString()} is invalid.`);
                return;
            }

            const lastBlock = await this.database.getLastBlock();

            Utils.assert.defined<Interfaces.IBlock>(lastBlock);

            const currentHeight = lastBlock.data.height;

            if (height >= currentHeight) {
                this.logger.error(
                    `Rollback height ${height.toLocaleString()} is greater than the current height ${currentHeight.toLocaleString()}.`,
                );
                return;
            }

            const roundInfo = Utils.roundCalculator.calculateRound(height);

            const newLastBlock = await this.database.rollback(roundInfo);

            this.logger.info(
                `Rolling back chain to last finished round ${roundInfo.round.toLocaleString()} with last block height ${newLastBlock.data.height.toLocaleString()}`,
            );
        } catch (err) {
            this.logger.error("ROLLBACK failed");
            this.logger.error(err.stack);
        }
    }

    public async rollbackByNumber(number: number): Promise<void> {
        this.logger.info("Running ROLLBACK by Number method inside SnapshotService");

        const lastBlock = await this.database.getLastBlock();

        return this.rollbackByHeight(lastBlock.data.height - number);
    }

    public async truncate(): Promise<void> {
        try {
            this.logger.info("Running TRUNCATE");

            await this.database.truncate();
        } catch (err) {
            this.logger.error("TRUNCATE failed");
            this.logger.error(err.stack);
        }
    }
}
