import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { Filesystem } from "./filesystem";
import { Meta, Options } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";
import { WorkerWrapper } from "./workers/worker-wrapper";

// @ts-ignore
import { Encoder, Decoder, JSONCodec , EncodeTransformer} from "./codecs";
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

        // let stopBlocksProgressDispatcher = await this.prepareProgressDispatcher(blocksWorker, "blocks", meta.blocks.count);
        // let stopTransactionsProgressDispatcher =await this.prepareProgressDispatcher(transactionsWorker, "transactions", meta.transactions.count);
        // let stopRoundsProgressDispatcher =await this.prepareProgressDispatcher(roundsWorker, "rounds", meta.rounds.count);

        try {
            await blocksWorker.start();
            // await transactionsWorker.start();
            // await roundsWorker.start();

            let milestoneHeights = Managers.configManager.getMilestones().map(x => x.height);
            milestoneHeights.push(Number.POSITIVE_INFINITY);
            milestoneHeights.push(Number.POSITIVE_INFINITY);

            console.log("Milestone heights: ", milestoneHeights)

            console.log("Result: ", await blocksWorker.sync({ nextValue: 1, nextField: "height"}))

            // @ts-ignore
            let result: any = undefined;
            // @ts-ignore
            // for (let height of milestoneHeights) {
                // let promises = [] as any;

                // promises.push(blocksWorker.sync({ nextValue: height, nextField: "height"}))
                //
                // if (result) {
                //     console.log("Run with: ", { nextCount: result.numberOfTransactions, height: result.height - 1  })
                //
                //     promises.push(transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: result.height - 1  }))
                //     promises.push(roundsWorker.sync({ nextValue: Utils.roundCalculator.calculateRound(height).round, nextField: "round"  }))
                // }

                // result = (await Promise.all(promises))[0];

                // if (result) {
                //     console.log("RUN Transactions: ", { nextCount: result.numberOfTransactions, height: result.height - 1  })
                //     console.log("Tra: ", await transactionsWorker.sync({ nextCount: result.numberOfTransactions, height: result.height - 1  }))
                // }

                // console.log("RUN Blocks: ", { nextValue: height, nextField: "height"})
                // result = await blocksWorker.sync({ nextValue: height, nextField: "height"})
                // result = await blocksWorker.sync({ nextValue: 1, nextField: "height"})
                //
                // break;

                // if (!result) {
                //     break;
                // }
            // }

        } catch (err) {
            // stopBlocksProgressDispatcher();
            // stopTransactionsProgressDispatcher();
            // stopRoundsProgressDispatcher();

            console.log("TERMINATED")

            throw err;
        }
        finally {
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
        // @ts-ignore
        let writeStream = fs.createWriteStream("/Users/sebastijankuzner/Desktop/ARK/Database/Test/asd");
        let dbStream = await this.blockRepository.getReadStream();

        let transformer = new Encoder(dbStream, writeStream,JSONCodec.encodeBlock);

        await transformer.write();

        // let encodeTransformer = new EncodeTransformer(JSONCodec.encodeBlock);
        //
        //
        // dbStream.pipe(encodeTransformer).pipe(writeStream);


        console.log("RESUMING");


        // let stream = fs.createReadStream("/Users/sebastijankuzner/Library/Application Support/ark-core/testnet/snapshots/testnet/1-261/blocks", {});


        let stream = fs.createReadStream("/Users/sebastijankuzner/Desktop/ARK/Database/Test/asd", {});

        let decoder = new Decoder(stream, JSONCodec.decodeBlock);


        for(let i = 0; i < 2; i++) {
            console.log(await decoder.readNext());
        }

        console.log("Finish");



        // await decoder.readNext();

        // // @ts-ignore
        // for(let i of [1,2,3,4,5,6,7]) {
        //     await decoder.readNext();
        // }


        // // stream.pipe(transformer)
        // stream = stream.pipe(transformer)
        //
        // stream.pipe(process.stdout);
    }
}


