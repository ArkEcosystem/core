import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { Filesystem } from "./filesystem";
import { Meta, Options } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { WorkerWrapper } from "./workers/worker-wrapper";

@Container.injectable()
export class SnapshotDatabaseService implements Contracts.Snapshot.DatabaseService {
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

    public init(codec?: string, skipCompression?: boolean): void {
        this.codec = codec || "default";
        this.skipCompression = skipCompression || false;
    }

    public async truncate(): Promise<void> {
        this.logger.info(
            `Clearing:  ${await this.blockRepository.count()} blocks,  ${await this.transactionRepository.count()} transactions,  ${await this.roundRepository.count()} rounds.`,
        );

        await this.transactionRepository.clear();
        await this.roundRepository.clear();
        await this.blockRepository.delete({}); // Clear does't work on tables with relations
    }

    public async rollbackChain(roundInfo: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock> {
        const lastBlock = await this.getLastBlock();

        Utils.assert.defined<Models.Block>(lastBlock);

        this.logger.info(`Last block height is: ${lastBlock.height}`);

        await this.blockRepository.rollbackChain(roundInfo);

        return this.getLastBlock();
    }

    public async dump(options: Options.DumpOptions): Promise<void> {
        this.logger.info("Start counting blocks");
        let meta = await this.prepareMetaData(options);

        this.logger.info(`Start running dump for ${meta.blocks.count} blocks`);

        this.filesystem.setSnapshot(meta.folder);
        await this.filesystem.prepareDir();

        let blocksWorker: WorkerWrapper | undefined = undefined;
        let transactionsWorker: WorkerWrapper | undefined = undefined;
        let roundsWorker: WorkerWrapper | undefined = undefined;

        try {
            blocksWorker = new WorkerWrapper(this.prepareWorkerData("dump", "blocks"));
            transactionsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "transactions"));
            roundsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "rounds"));

            await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
            await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
            await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

            await Promise.all([
                blocksWorker.start(),
                transactionsWorker.start(),
                roundsWorker.start()
            ]);

            await this.filesystem.writeMetaData(meta);
        } catch (err) {
            console.log(err);
        } finally {
            await blocksWorker?.terminate();
            await transactionsWorker?.terminate();
            await roundsWorker?.terminate();
        }
    }

    public async restore(meta: Meta.MetaData): Promise<void> {
        await this.truncate();

        await this.runSynchronizedAction("restore", meta);
    }

    public async verify(meta: Meta.MetaData): Promise<void> {
        await this.runSynchronizedAction("verify", meta);
    }

    private async runSynchronizedAction(action: string, meta: Meta.MetaData): Promise<void> {
        let error: Error | undefined = undefined;

        let blocksWorker: WorkerWrapper | undefined = undefined;
        let transactionsWorker: WorkerWrapper | undefined = undefined;
        let roundsWorker: WorkerWrapper | undefined = undefined;

        try {
            blocksWorker = new WorkerWrapper(this.prepareWorkerData(action, "blocks"));
            transactionsWorker = new WorkerWrapper(this.prepareWorkerData(action, "transactions"));
            roundsWorker = new WorkerWrapper(this.prepareWorkerData(action, "rounds"));

            // await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
            // await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
            // await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

            await blocksWorker.start();
            await transactionsWorker.start();
            await roundsWorker.start();

            let milestoneHeights = Managers.configManager.getMilestones().map(x => x.height);
            milestoneHeights.push(Number.POSITIVE_INFINITY);

            console.log("Milestone heights: ", milestoneHeights)

            // @ts-ignore
            let result: any = undefined;
            // @ts-ignore
            let prevHeight = undefined;
            for (let height of milestoneHeights) {
                let promises = [] as any;

                promises.push(blocksWorker.sync({ nextValue: height, nextField: "height"}))

                if (result) {
                    console.log("Run with: ", { nextCount: result.numberOfTransactions, height: result.height - 1  })

                    promises.push(transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: result.height - 1  }))
                    promises.push(roundsWorker.sync({ nextValue: Utils.roundCalculator.calculateRound(height).round, nextField: "round"  }))
                }

                result = (await Promise.all(promises))[0];

                if (!result) {
                    continue;
                }

                console.log("result: ", result);

                prevHeight = height;
            }

        } catch (err) {
            error = err
            console.log("ERR", err);
        }
        finally {
            await blocksWorker?.terminate();
            await transactionsWorker?.terminate();
            await roundsWorker?.terminate();
        }

        if (error) {
            throw error;
        }
    }

    // @ts-ignore
    private async prepareMetaData(options: Options.DumpOptions): Promise<Meta.MetaData> {
        const blocksCount = await this.blockRepository.count();
        this.logger.info("Finish counting");

        const startHeight = (await this.blockRepository.findFirst())?.height;
        this.logger.info("Found first block");

        const endHeight = (await this.blockRepository.findLast())?.height;
        this.logger.info("Found last block");


        return {
            blocks: {
                count: blocksCount,
                startHeight: startHeight!,
                endHeight: endHeight!
            },
            transactions: {
                count: await this.transactionRepository.count(),
                startHeight: startHeight!,
                endHeight: endHeight!
            },
            rounds: {
                count: await this.roundRepository.count(),
                startHeight: startHeight!,
                endHeight: endHeight!
            },
            folder: `${startHeight}-${endHeight}`,

            skipCompression: this.skipCompression,
            network: options.network,

            packageVersion: this.app.get<string>(Identifiers.SnapshotVersion),
            codec: this.codec
        };
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        let block: Interfaces.IBlockData | undefined = await this.blockRepository.findLast();

        // TODO: Error
        // if (!block) {
        //     throw new Error("Cannot find last block")
        // }

        Utils.assert.defined<Interfaces.IBlockData>(block);

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block)!;

        return lastBlock;
    }

    private prepareWorkerData(action: string, table: string): any {
        return {
            actionOptions: {
                network: this.app.network(),
                action: action,
                table: table,
                codec: this.codec,
                skipCompression: this.skipCompression,
                filePath: `${this.filesystem.getSnapshotPath()}${table}`,
                genesisBlockId: Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id,
                updateStep: this.configuration.getOptional("dispatchUpdateStep", 1000)
            },
            connection: this.configuration.get("connection")
        };
    }

    // @ts-ignore
    private async prepareProgressDispatcher(worker: WorkerWrapper, table: string, count: number): Promise<void> {
        let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);

        await progressDispatcher.start(table, count);

        worker.on("count", async (count: number) => {
            await progressDispatcher.update(count);
        });

        worker.on("exit", async () => {
            await progressDispatcher.end();
        })
    }


    public async test(options: any): Promise<void> {
        // console.log(Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id);

        let result = await this.transactionRepository.createQueryBuilder()
            .orderBy("timestamp" ,"ASC")
            .addOrderBy("sequence" ,"ASC")
            .limit(100)
            .execute();

        console.log(result);
    }
}


