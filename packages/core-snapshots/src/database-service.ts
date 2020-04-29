import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { Filesystem } from "./filesystem/filesystem";
import { Meta, Options } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { WorkerWrapper } from "./workers/worker-wrapper";

// @ts-ignore
import { JSONCodec, Codec} from "./codecs";
// @ts-ignore
import { StreamWriter, StreamReader} from "./filesystem";
// @ts-ignore
import fs from "fs-extra";
// @ts-ignore
import ByteBuffer from "bytebuffer";


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
            `Clearing:  ${await this.blockRepository.count()} blocks,   ${await this.transactionRepository.count()} transactions,  ${await this.roundRepository.count()} rounds`,
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

        let blocksWorker = new WorkerWrapper(this.prepareWorkerData("dump", "blocks"));
        let transactionsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "transactions"));
        let roundsWorker = new WorkerWrapper(this.prepareWorkerData("dump", "rounds"));

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

            this.logger.error(err.message);
            throw err;
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
        let blocksWorker = new WorkerWrapper(this.prepareWorkerData(action, "blocks"));
        let transactionsWorker = new WorkerWrapper(this.prepareWorkerData(action, "transactions"));
        let roundsWorker = new WorkerWrapper(this.prepareWorkerData(action, "rounds"));

        let stopBlocksProgressDispatcher = await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
        let stopTransactionsProgressDispatcher =await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
        let stopRoundsProgressDispatcher =await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

        try {
            await blocksWorker.start();
            await transactionsWorker.start();
            await roundsWorker.start();

            // let milestoneHeights = [] as number[];
            let milestoneHeights = Managers.configManager.getMilestones().map(x => x.height);
            milestoneHeights.push(Number.POSITIVE_INFINITY);
            milestoneHeights.push(Number.POSITIVE_INFINITY);

            // console.log("Milestone heights: ", milestoneHeights)

            // console.log("Result: ", await blocksWorker.sync({ nextValue: 1, nextField: "height"}))

            // @ts-ignore
            let result: any = undefined;
            // @ts-ignore
            for (let height of milestoneHeights) {
                let promises = [] as any;

                // console.log("Run blocks with: ",{ nextValue: height, nextField: "height"})
                promises.push(blocksWorker.sync({ nextValue: height, nextField: "height"}))

                if (result) {
                    // console.log("Run transactions with: ", { nextCount: result.numberOfTransactions, height: result.height - 1  })
                    // console.log("Run rounds with: ", { nextCount: Utils.roundCalculator.calculateRound(result.height).round, height: result.height - 1  })

                    promises.push(transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: result.height - 1  }))
                    promises.push(roundsWorker.sync({ nextValue: Utils.roundCalculator.calculateRound(result.height).round, nextField: "round"  }))
                }

                let tmpResult = (await Promise.all(promises));

                // console.log("RESULT: ", tmpResult);

                result = tmpResult[0];

                if (!result) {
                    // console.log("Calling break");
                    break;
                }

                // console.log(await transactionsWorker.sync({ nextCount: 1002869, height: 4005999  }))
                // console.log(await transactionsWorker.sync({ nextCount: 1014031, height: 4810016  }))
            }
        } catch (err) {
            stopBlocksProgressDispatcher();
            stopTransactionsProgressDispatcher();
            stopRoundsProgressDispatcher();

            console.log("ERROR", err)
            console.log("ERROR", err.message)

            this.logger.error(err.message)
            throw err;
        }
        finally {
            console.log("Calling finaly");

            await blocksWorker?.terminate();
            await transactionsWorker?.terminate();
            await roundsWorker?.terminate();
        }
    }

    private async prepareMetaData(options: Options.DumpOptions): Promise<Meta.MetaData> {
        const blocksCount = await this.blockRepository.count();
        this.logger.info("Finish counting ");

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

    // @ts-ignore
    private waitToEnd(writableStream: NodeJS.WritableStream): Promise<void> {
        return new Promise<void>((resolve) => {
            writableStream.once("close", () => {
                resolve();
            })
        })
    }

    public async test(options: any): Promise<void> {
        // try {
        //     let worker = new WorkerWrapper(    {actionOptions: {
        //             action: "test",
        //             table: "wait",
        //             codec: "default",
        //             skipCompression: false,
        //             filePath: "",
        //             genesisBlockId: "123",
        //             updateStep: 1000,
        //             network: "testnet"
        //         }});
        //
        //     await worker.start();
        //
        //     await worker.sync({
        //         execute: "throwError"
        //     });
        // } catch (e) {
        //
        // }


        // try {
        //     // let streamReader = new StreamReader("/Users/sebastijankuzner/Library/Application Support/ark-core/devnet/snapshots/devnet/1-4810017/blocks", new Codec().blocksDecode);
        //     let streamReader = new StreamReader("/Users/sebastijankuzner/Library/Application Support/ark-core/testnet/snapshots/testnet/1-2/transactions", new Codec().transactionsDecode);
        //
        //     await streamReader.open();
        //
        //     // for(let i = 0; i< 342; i++) {
        //     for(let i = 0; i< 2; i++) {
        //         console.log(await streamReader.readNext());
        //         // await streamReader.readNext();
        //     }
        //
        //     console.log(await streamReader.readNext());
        //     console.log(await streamReader.readNext());
        // } catch (err) {
        //     console.log(err)
        // }

        let transaction = await this.transactionRepository.findById("7fc3fffc2e9d85ffefc5065dc0a8eb7bb1c45718ac879d2688adfe6f9ac5d49b")

        console.log(transaction);

        let result = Transactions.TransactionFactory.fromBytes(transaction.serialized, false);

        console.log(result);

    }
}


