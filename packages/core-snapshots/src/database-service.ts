import { Worker } from "worker_threads";

import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";


import { Identifiers } from "./ioc";
import { Filesystem } from "./filesystem";
import { Meta, Options } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { WorkerInstance } from "./workers/worker-instance";

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
        let metaData = await this.prepareMetaData(options);

        this.logger.info(`Start running dump for ${metaData.blocks.count} blocks`);

        this.filesystem.setSnapshot(metaData.folder);
        await this.filesystem.prepareDir();

        const blocksWorker = await this.createWorker("dump", "blocks");
        const transactionsWorker = await this.createWorker("dump","transactions");
        const roundsWorker = await this.createWorker("dump","rounds");

        try {
            await Promise.all([
                this.startWorkerAction(blocksWorker, "blocks", await this.blockRepository.count()),
                this.startWorkerAction(transactionsWorker, "transactions", await this.transactionRepository.count()),
                this.startWorkerAction(roundsWorker, "rounds", await this.roundRepository.count()),
            ]);

            await this.filesystem.writeMetaData(metaData);
        } finally {
            await blocksWorker.terminate();
            await transactionsWorker.terminate();
            await roundsWorker.terminate();
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

        let blocksWorker: WorkerInstance | undefined = undefined;
        let transactionsWorker: WorkerInstance | undefined = undefined;
        let roundsWorker: WorkerInstance | undefined = undefined;

        try {
            blocksWorker = new WorkerInstance(this.prepareWorkerData(action, "blocks"));
            transactionsWorker = new WorkerInstance(this.prepareWorkerData(action, "transactions"));
            roundsWorker = new WorkerInstance(this.prepareWorkerData(action, "rounds"));

            await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
            await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
            await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

            await blocksWorker.init();
            await transactionsWorker.init();
            await roundsWorker.init();

            await blocksWorker.start();
            await transactionsWorker.start();
            await roundsWorker.start();

            let milestoneHeights = Managers.configManager.getMilestones().map(x => x.height);
            milestoneHeights.push(Number.POSITIVE_INFINITY);

            // @ts-ignore
            let result: any = undefined;
            // @ts-ignore
            let prevHeight = undefined;
            for (let height of milestoneHeights) {
                let promises = [] as any;

                promises.push(blocksWorker.sync({ nextValue: height, nextField: "height"}))

                if (result) {
                    promises.push(transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: prevHeight }))
                    promises.push(roundsWorker.sync({ nextCount: result.numberOfRounds, height: prevHeight }))
                }

                result = (await Promise.all(promises))[0];
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

    private createWorker(action: string, table: string): Promise<Worker> {
        return new Promise<Worker>((resolve) => {
            let worker = new Worker(__dirname +  "/workers/worker.js", {workerData: this.prepareWorkerData(action, table)});

            worker.once("message", ({action}) => {
                if (action === "initialized") {
                    resolve(worker);
                }
            })
        })

    }

    // @ts-ignore
    private async prepareProgressDispatcher(worker: WorkerInstance, table: string, count: number): Promise<void> {
        let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);

        await progressDispatcher.start(table, count);

        worker.on("count", async (count: number) => {
            await progressDispatcher.update(count);
        });

        worker.on("exit", async () => {
            await progressDispatcher.end();
        })
    }

    private startWorkerAction(worker: Worker, table: string, count: number): Promise<void> {
        let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);

        return new Promise<void>(async (resolve, reject) => {
            worker.on("error", (err) => {
                this.logger.error(err.message);
                reject(err);
            });

            worker.on("count", async (count: number) => {
                await progressDispatcher.update(count);
            });

            worker.once("exit", async (exitCode) => {
                await progressDispatcher.end();
                resolve();
            });

            await progressDispatcher.start(table, count);

            worker.postMessage({ action: "start" });
        });
    }

    public async test(options: any): Promise<void> {
        // console.log(Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id);
    }
}


