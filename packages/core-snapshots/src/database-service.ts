import { Worker } from "worker_threads";

import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { Filesystem as SnapshotUtils } from "./filesystem";
import { Meta, Options } from "./contracts";
import { ProgressDispatcher } from "./progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "./repositories";

@Container.injectable()
export class SnapshotDatabaseService implements Contracts.Snapshot.DatabaseService {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-snapshots")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotUtils)
    private readonly utils!: SnapshotUtils;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly roundRepository!: RoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    private codec: string = "default";
    private skipCompression: boolean = false;

    public init(codec: string | undefined, skipCompression: boolean | undefined): void {
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
        const lastRemainingBlock = await this.getLastBlock();

        Utils.assert.defined<Models.Block>(lastRemainingBlock);

        this.logger.info(`Last block height is: ${lastRemainingBlock.height}`);

        await this.blockRepository.rollbackChain(roundInfo);

        return this.getLastBlock();
    }

    public async dump(options: Options.DumpOptions): Promise<void> {
        let metaData = await this.prepareMetaData(options);

        this.utils.setSnapshot(metaData.folder);
        await this.utils.prepareDir();

        const blocksWorker = this.createWorker("dump", "blocks");
        const transactionsWorker = this.createWorker("dump","transactions");
        const roundsWorker = this.createWorker("dump","rounds");

        try {
            await Promise.all([
                this.startWorkerAction(blocksWorker, "blocks", await this.blockRepository.count()),
                this.startWorkerAction(transactionsWorker, "transactions", await this.transactionRepository.count()),
                this.startWorkerAction(roundsWorker, "rounds", await this.roundRepository.count()),
            ]);

            await this.utils.writeMetaData(metaData);
        } finally {
            await blocksWorker.terminate();
            await transactionsWorker.terminate();
            await roundsWorker.terminate();
        }
    }

    public async restore(meta: Meta.MetaData): Promise<void> {
        await this.truncate();

        const blocksWorker = this.createWorker("restore", "blocks");
        const transactionsWorker = this.createWorker("restore", "transactions");
        const roundsWorker = this.createWorker("restore","rounds");

        try {
            await this.startWorkerAction(blocksWorker, "blocks", meta.blocks.count);

            await Promise.all([
                this.startWorkerAction(transactionsWorker, "transactions", meta.transactions.count),
                this.startWorkerAction(roundsWorker, "rounds", meta.rounds.count),
            ]);
        } finally {
            await blocksWorker.terminate();
            await transactionsWorker.terminate();
            await roundsWorker.terminate();
        }
    }

    public async verify(meta: Meta.MetaData): Promise<void> {
        const blocksWorker = this.createWorker("verify", "blocks");
        const transactionsWorker = this.createWorker("verify", "transactions");
        const roundsWorker = this.createWorker("verify","rounds");

        try {
            await Promise.all([
                this.startWorkerAction(blocksWorker, "blocks", meta.blocks.count),
                this.startWorkerAction(transactionsWorker, "transactions", meta.transactions.count),
                this.startWorkerAction(roundsWorker, "rounds", meta.rounds.count),
            ]);
        } finally {
            await blocksWorker.terminate();
            await transactionsWorker.terminate();
            await roundsWorker.terminate();
        }
    }

    private async prepareMetaData(options: Options.DumpOptions): Promise<Meta.MetaData> {
        const blocksCount = await this.blockRepository.count();
        const startHeight = (await this.blockRepository.findFirst())?.height;
        const endHeight = (await this.blockRepository.findLast())?.height;

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

        if (!block) {
            throw new Error("Cannot find last block")
        }

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block)!;

        return lastBlock;
    }

    public async test(options: any): Promise<void> {
        console.log(Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id);
    }

    private createWorker(action: string, table: string): Worker {
        let data = {
            actionOptions: {
                action: action,
                table: table,
                codec: this.codec,
                skipCompression: this.skipCompression,
                filePath: `${this.utils.getSnapshotFolderPath()}${table}`,
                genesisBlockId: Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id,
                updateStep: this.configuration.getOptional("dispatchUpdateStep", 1000)
            },
            connection: this.configuration.get("connection")
        };

        return  new Worker(__dirname +  "/workers/worker.js", {workerData: data});
    }

    private startWorkerAction(worker: Worker, table: string, count: number): Promise<void> {
        let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);

        return new Promise<void>(async (resolve) => {
            worker.on("error", (err) => {
                console.log("ERROR", err);
            });

            worker.on("message", async (count: number) => {
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
}


