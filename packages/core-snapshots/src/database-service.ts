import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers, Types } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { Filesystem } from "./filesystem/filesystem";
import { Meta, Options, Database, Worker } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { WorkerWrapper } from "./workers/worker-wrapper";

@Container.injectable()
export class SnapshotDatabaseService implements Database.DatabaseService {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-snapshots")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotFilesystem)
    private readonly filesystem!: Filesystem;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly roundRepository!: RoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;


    private codec: string = "default";
    private skipCompression: boolean = false;
    private verifyData: boolean = false;

    public init(codec?: string, skipCompression?: boolean, verify: boolean = false): void {
        this.codec = codec || "default";
        this.skipCompression = skipCompression || false;
        this.verifyData = verify || false;
    }

    public async truncate(): Promise<void> {
        this.logger.info(
            `Clearing:  ${await this.blockRepository.count()} blocks,   ${await this.transactionRepository.count()} transactions,  ${await this.roundRepository.count()} rounds`,
        );

        await this.transactionRepository.clear();
        await this.roundRepository.clear();
        await this.blockRepository.delete({}); // Clear does't work on tables with relations
    }

    public async rollback(roundInfo: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock> {
        const lastBlock = await this.blockRepository.findLast();

        Utils.assert.defined<Models.Block>(lastBlock);

        this.logger.info(`Last block height is: ${lastBlock.height}`);

        await this.blockRepository.rollback(roundInfo);

        return this.getLastBlock();
    }

    public async dump(options: Options.DumpOptions): Promise<void> {
        this.logger.info("Start counting blocks, rounds and transactions");

        let dumpRage = await this.getDumpRange(options.start, options.end);
        let meta = this.prepareMetaData(options, dumpRage);

        this.logger.info(`Start running dump for ${dumpRage.blocksCount} blocks, ${dumpRage.roundsCount} rounds and ${dumpRage.transactionsCount} transactions`);

        this.filesystem.setSnapshot(meta.folder);
        await this.filesystem.prepareDir();

        let blocksWorker = new WorkerWrapper(this.prepareWorkerData("dump", "blocks", meta));
        let transactionsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "transactions", meta));
        let roundsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "rounds", meta));

        let stopBlocksDispatcher = await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
        let stopTransactionsDispatcher = await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
        let stopRoundDispatcher = await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

        try {
            await Promise.all([
                blocksWorker.start(),
                transactionsWorker.start(),
                roundsWorker.start()
            ]);

            await this.filesystem.writeMetaData(meta);
        } catch (err) {
            stopBlocksDispatcher();
            stopTransactionsDispatcher();
            stopRoundDispatcher();

            throw err;
        } finally {
            await blocksWorker?.terminate();
            await transactionsWorker?.terminate();
            await roundsWorker?.terminate();
        }
    }

    public async restore(meta: Meta.MetaData, options: Options.RestoreOptions): Promise<void> {
        if (options.truncate) {
            await this.truncate();
        }

        await this.runSynchronizedAction("restore", meta);
    }

    public async verify(meta: Meta.MetaData): Promise<void> {
        await this.runSynchronizedAction("verify", meta);
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        let block: Interfaces.IBlockData | undefined = await this.blockRepository.findLast();

        Utils.assert.defined<Interfaces.IBlockData>(block);

        /* istanbul ignore next */
        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block, () => {return block!.timestamp})!;

        return lastBlock;
    }

    private async runSynchronizedAction(action: string, meta: Meta.MetaData): Promise<void> {
        let blocksWorker = new WorkerWrapper(this.prepareWorkerData(action, "blocks", meta));
        let transactionsWorker = new WorkerWrapper(this.prepareWorkerData(action, "transactions", meta));
        let roundsWorker = new WorkerWrapper(this.prepareWorkerData(action, "rounds", meta));

        let stopBlocksProgressDispatcher = await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
        let stopTransactionsProgressDispatcher =await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
        let stopRoundsProgressDispatcher =await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

        try {
            await blocksWorker.start();
            await transactionsWorker.start();
            await roundsWorker.start();

            let milestoneHeights = Managers.configManager.getMilestones().map(x => x.height);
            milestoneHeights.push(Number.POSITIVE_INFINITY);
            milestoneHeights.push(Number.POSITIVE_INFINITY);

            let result: any = undefined;
            for (let height of milestoneHeights) {
                let promises = [] as any;

                // console.log("Run blocks with: ",{ nextValue: height, nextField: "height"})
                promises.push(blocksWorker.sync({ nextValue: height, nextField: "height"}))

                if (result && result.height > 0) {
                    // console.log("Run transactions with: ", { nextCount: result.numberOfTransactions, height: result.height - 1  })
                    // console.log("Run rounds with: ", { nextCount: Utils.roundCalculator.calculateRound(result.height).round, height: result.height - 1  })

                    promises.push(transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: result.height - 1  }))
                    promises.push(roundsWorker.sync({ nextValue: Utils.roundCalculator.calculateRound(result.height).round, nextField: "round"  }))
                }

                result = (await Promise.all(promises))[0];

                // console.log("Result: ", result)

                if (!result) {
                    break;
                }
            }
        } catch (err) {
            stopBlocksProgressDispatcher();
            stopTransactionsProgressDispatcher();
            stopRoundsProgressDispatcher();

            throw err;
        }
        finally {
            await blocksWorker?.terminate();
            await transactionsWorker?.terminate();
            await roundsWorker?.terminate();
        }
    }

    private async getDumpRange(start?: number, end?: number): Promise<Database.DumpRange> {
        let lastBlock = await this.blockRepository.findLast();

        if (!lastBlock) {
            throw new Error("Database is empty");
        }

        let firstHeight = start || 1;
        let lastHeight = end || lastBlock?.height || 1;

        let firstRound = Utils.roundCalculator.calculateRound(firstHeight);
        let lastRound = Utils.roundCalculator.calculateRound(lastHeight);

        if (firstRound.roundHeight >= lastRound.roundHeight) {
            throw new Error("Start round is greater or equal to end round")
        }

        let firstBlock = await this.blockRepository.findByHeight(firstRound.roundHeight);
        lastBlock = await this.blockRepository.findByHeight(lastRound.roundHeight);

        Utils.assert.defined<Models.Block>(firstBlock);
        Utils.assert.defined<Models.Block>(lastBlock);

        let result: Database.DumpRange = {
            firstBlockHeight: firstBlock!.height,
            lastBlockHeight: lastBlock!.height,
            blocksCount: await this.blockRepository.countInRange(firstBlock!.height, lastBlock!.height),

            firstRoundRound: firstRound.round,
            lastRoundRound: lastRound.round,
            roundsCount: await this.roundRepository.countInRange(firstRound.round, lastRound.round),

            firstTransactionTimestamp: firstBlock!.timestamp,
            lastTransactionTimestamp: lastBlock!.timestamp,
            transactionsCount: await this.transactionRepository.countInRange(firstBlock!.timestamp, lastBlock!.timestamp),
        }

        return result;
    }

    private prepareMetaData(options: Options.DumpOptions, dumpRange: Database.DumpRange): Meta.MetaData {
        return {
            blocks: {
                count: dumpRange.blocksCount,
                start: dumpRange.firstBlockHeight,
                end: dumpRange.lastBlockHeight
            },
            transactions: {
                count: dumpRange.transactionsCount,
                start: dumpRange.firstTransactionTimestamp,
                end: dumpRange.lastTransactionTimestamp
            },
            rounds: {
                count: dumpRange.roundsCount,
                start: dumpRange.firstRoundRound,
                end: dumpRange.lastRoundRound
            },
            folder: `${dumpRange.firstBlockHeight}-${dumpRange.lastBlockHeight}`,

            skipCompression: this.skipCompression,
            network: options.network,

            packageVersion: this.app.get<string>(Identifiers.SnapshotVersion),
            codec: this.codec
        };
    }

    private prepareWorkerData(action: string, table: string, meta: Meta.MetaData): any {
        let result: Worker.WorkerData = {
            actionOptions: {
                network: this.app.network() as Types.NetworkName,
                action: action,
                table: table,
                start: meta[table].start,
                end: meta[table].end,
                codec: this.codec,
                skipCompression: this.skipCompression,
                verify: this.verifyData,
                filePath: `${this.filesystem.getSnapshotPath()}${table}`,
                genesisBlockId: Managers.configManager.get("genesisBlock").id,
                updateStep: this.configuration.getOptional("updateStep", 1000)
            },
            connection: this.configuration.get("connection")
        }

        return result;
    }

    // @ts-ignore
    private async prepareProgressDispatcher(worker: WorkerWrapper, table: string, count: number): Promise<Function> {
        let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);

        await progressDispatcher.start(table, count);

        let onCount = async (count: number) => {
            await progressDispatcher.update(count);
        }

        let onExit = async () => {
            await progressDispatcher.end();
        }

        worker.on("count", onCount);

        worker.on("exit", onExit)

        return () => {
            worker.removeListener("count", onCount)
            worker.removeListener("exit", onExit)
        }
    }
}


