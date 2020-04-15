import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { SnapshotBlockRepository, SnapshotRoundRepository, SnapshotTransactionRepository } from "./repositories";
import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";

import { Utils as SnapshotUtils } from "./utils";
import { Meta, Options } from "./contracts";

import { Worker } from "worker_threads";

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
    private readonly snapshotBlockRepository!: SnapshotBlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly snapshotRoundRepository!: SnapshotRoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly snapshotTransactionRepository!: SnapshotTransactionRepository;

    private codec: string = "default";

    private skipCompression: boolean = false;

    public init(codec: string | undefined, skipCompression: boolean | undefined): void {
        this.codec = codec || "default";
        this.skipCompression = skipCompression || false;
    }

    public async truncate(): Promise<void> {
        this.logger.info(
            `Clearing:  ${await this.snapshotBlockRepository.count()} blocks,  ${await this.snapshotTransactionRepository.count()} transactions,  ${await this.snapshotRoundRepository.count()} rounds.`,
        );

        await this.snapshotTransactionRepository.clear();
        await this.snapshotRoundRepository.clear();
        await this.snapshotBlockRepository.delete({}); // Clear does't work on tables with relations
    }

    public async rollbackChain(roundInfo: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock> {
        const lastRemainingBlock = await this.getLastBlock();

        Utils.assert.defined<Models.Block>(lastRemainingBlock);

        this.logger.info(`Last block height is: ${lastRemainingBlock.height}`);


        await this.snapshotBlockRepository.rollbackChain(roundInfo);

        return this.getLastBlock();
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        let block: Interfaces.IBlockData | undefined = await this.snapshotBlockRepository.findLast();

        if (!block) {
            throw new Error("Cannot find last block")
        }

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block)!;

        return lastBlock;
    }

    createWorker(action: string, table: string): Worker {
        let data = {
            actionOptions: {
                action: action,
                table: table,
                codec: "default",
                skipCompression: false,
                filePath: `${this.utils.getSnapshotFolderPath()}${table}`,
                genesisBlockId: Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!.data.id
            },
            connection: this.configuration.get("connection")
        };

        return  new Worker(__dirname +  "/workers/worker.js", {workerData: data});
    }

    public async dump(options: Options.DumpOptions): Promise<void> {
        let metaData = await this.prepareMetaData(options);

        this.utils.setSnapshot(metaData.folder);
        await this.utils.prepareDir();

        const blocksWorker = this.createWorker("dump", "blocks");
        const transactionsWorker = this.createWorker("dump","transactions");
        const roundsWorker = this.createWorker("dump","rounds");


        // TODO: Try catch
        await Promise.all([
            this.startWorkerAction(blocksWorker),
            this.startWorkerAction(transactionsWorker),
            this.startWorkerAction(roundsWorker),
        ]);

        await blocksWorker.terminate();
        await transactionsWorker.terminate();
        await roundsWorker.terminate();

        await this.utils.writeMetaData(metaData);
    }

    public async restore(meta: Meta.MetaData): Promise<void> {
        await this.truncate();

        const blocksWorker = this.createWorker("restore", "blocks");
        const transactionsWorker = this.createWorker("restore", "transactions");
        const roundsWorker = this.createWorker("restore","rounds");

        await this.startWorkerAction(blocksWorker);
        console.log("BLOCKS Finish");


        // TODO: Try catch
        await Promise.all([
            this.startWorkerAction(transactionsWorker),
            this.startWorkerAction(roundsWorker),
        ]);

        await blocksWorker.terminate();
        await transactionsWorker.terminate();
        await roundsWorker.terminate();
    }

    public async verify(meta: Meta.MetaData): Promise<void> {
        const blocksWorker = this.createWorker("verify", "blocks");
        const transactionsWorker = this.createWorker("verify", "transactions");
        const roundsWorker = this.createWorker("verify","rounds");

        await Promise.all([
            this.startWorkerAction(blocksWorker),
            this.startWorkerAction(transactionsWorker),
            this.startWorkerAction(roundsWorker),
        ]);

        await blocksWorker.terminate();
        await transactionsWorker.terminate();
        await roundsWorker.terminate();
    }

    private async prepareMetaData(options: Options.DumpOptions): Promise<Meta.MetaData> {
        const blocksCount = await this.snapshotBlockRepository.count();
        const startHeight = (await this.snapshotBlockRepository.findFirst())?.height;
        const endHeight = (await this.snapshotBlockRepository.findLast())?.height;

        return {
            blocks: {
                count: blocksCount,
                startHeight: startHeight!,
                endHeight: endHeight!
            },
            transactions: {
                count: await this.snapshotTransactionRepository.count(),
                startHeight: startHeight!,
                endHeight: endHeight!
            },
            rounds: {
                count: await this.snapshotRoundRepository.count(),
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

    public async test(options: any): Promise<void> {
    }


    private startWorkerAction(worker: Worker): Promise<void> {
        return new Promise<void>((resolve) => {
            worker.once("exit", async (exitCode) => {
                console.log(`Successful exit on worker running for table with exit code ${exitCode}`);
                // console.log(`Successful exit on worker running ${action} for table ${table} with exit code ${exitCode}`);
                resolve();
            });

            worker.postMessage({ action: "start" });
        });
    }
}


