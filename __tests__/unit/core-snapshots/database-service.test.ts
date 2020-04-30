import "jest-extended";
import { dirSync, setGracefulCleanup } from "tmp";

// @ts-ignore
import * as workerThreads from "worker_threads";
import { EventEmitter } from "events";
import { Connection } from "typeorm";
import { Container, Providers } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { SnapshotDatabaseService } from "@packages/core-snapshots/src/database-service";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Filesystem } from "@packages/core-snapshots/src/filesystem/filesystem";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";
import { ProgressDispatcher } from "@packages/core-snapshots/src/progress-dispatcher";
import { BlockRepository, TransactionRepository, RoundRepository } from "@packages/core-snapshots/src/repositories";

import { Assets } from "./__fixtures__";

let sandbox: Sandbox;
let database: SnapshotDatabaseService;
let filesystem: Filesystem;

class MockWorkerWrapper extends EventEmitter {
    constructor() {
        super();
    }

    public async start() {
        this.emit("count", 1)
        this.emit("exit")
    }

    public async sync() {}
    public async terminate() {}
}

let mockWorkerWrapper;

jest.mock('@packages/core-snapshots/src/workers/worker-wrapper', ()=> {
    return {
        WorkerWrapper : jest.fn().mockImplementation(() => { return mockWorkerWrapper })
    }
});


const configuration = {
    chunkSize: 50000,
    dispatchUpdateStep: 1000,
    connection: {},
}

let logger;
let connection: Partial<Connection>;
let blockRepository: Partial<BlockRepository>;
let transactionRepository: Partial<TransactionRepository>;
let roundRepository: Partial<RoundRepository>;
let progressDispatcher: Partial<ProgressDispatcher>;

beforeEach(() => {
    mockWorkerWrapper = new MockWorkerWrapper();
    mockWorkerWrapper.sync = jest.fn().mockResolvedValue({ numberOfTransactions: 1, height: 1 });
    mockWorkerWrapper.terminate = jest.fn();
    mockWorkerWrapper.removeListener = jest.fn();

    logger = {
        info: jest.fn(),
        error: jest.fn(),
    };

    connection = {
        isConnected: true
    };


    let lastBlock = Assets.blocksBigNumber[0];
    lastBlock.height = 100;

    blockRepository = {
        count: jest.fn().mockResolvedValue(1),
        clear: jest.fn(),
        delete : jest.fn(),
        findFirst: jest.fn().mockResolvedValue(Assets.blocksBigNumber[0] as any),
        findLast: jest.fn().mockResolvedValue(lastBlock as any),
        findByHeight: jest.fn().mockResolvedValue(lastBlock as any),
        rollback: jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5)
    };

    transactionRepository = {
        count: jest.fn(),
        clear: jest.fn(),
        delete : jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5)
    };

    roundRepository = {
        count: jest.fn(),
        clear: jest.fn(),
        delete : jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5)
    };

    progressDispatcher = {
        start: jest.fn(),
        end: jest.fn(),
        update: jest.fn(),
    };

    sandbox = new Sandbox;

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

    sandbox.app.bind(Container.Identifiers.ApplicationNetwork).toConstantValue("testnet");

    sandbox.app.bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("plugin", "@arkecosystem/core-snapshots"));

    sandbox.app.bind(Container.Identifiers.FilesystemService).to(LocalFilesystem).inSingletonScope();
    sandbox.app.bind(Identifiers.SnapshotFilesystem).to(Filesystem).inSingletonScope();

    sandbox.app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(blockRepository);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue(transactionRepository);
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(roundRepository);

    sandbox.app.bind(Identifiers.ProgressDispatcher).toConstantValue(progressDispatcher);

    sandbox.app.bind(Identifiers.SnapshotVersion).toConstantValue("3.0.0-next.0");

    sandbox.app.bind(Identifiers.SnapshotDatabaseService).to(SnapshotDatabaseService).inSingletonScope();

    let pluginConfiguration = sandbox.app.getTagged<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration, "plugin", "@arkecosystem/core-snapshots");

    pluginConfiguration.set("chunkSize", configuration.chunkSize)
    pluginConfiguration.set("dispatchUpdateStep", configuration.dispatchUpdateStep)
    pluginConfiguration.set("connection", configuration.connection)

    database = sandbox.app.get<SnapshotDatabaseService>(Identifiers.SnapshotDatabaseService);
    filesystem = sandbox.app.get<Filesystem>(Identifiers.SnapshotFilesystem);
});

afterEach(() => {
    setGracefulCleanup();
});

describe("DatabaseService", () => {

    describe("init", () => {
        it("should be ok", async () => {
            database.init("default", false);
        });
    });

    describe("truncate", () => {
        it("should call delete and clear method on transaction, block and round", async () => {
            await expect(database.truncate()).toResolve();

            expect(blockRepository.delete).toHaveBeenCalled();
            expect(transactionRepository.clear).toHaveBeenCalled();
            expect(roundRepository.clear).toHaveBeenCalled();
        });
    });

    describe("getLastBlock", () => {
        it("should return block", async () => {
            await expect(database.getLastBlock()).toResolve();
        });
    });

    describe("rollbackChain", () => {
        it("should rollback chain to specific height", async () => {
            let roundInfo = {
                round: 1,
                nextRound: 2,
                maxDelegates: 51,
                roundHeight: 1,
            }

            await expect(database.rollback(roundInfo)).toResolve();
        });
    });

    describe("dump", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default"
            }

            let promise = database.dump(dumpOptions);

            await expect(promise).toResolve();
        });

        it("should throw error if last block is not found", async () => {
            blockRepository.findLast = jest.fn().mockResolvedValue(undefined);

            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default"
            }

            let promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
        });

        it("should throw error if last and first block are in same range", async () => {
            blockRepository.findLast = jest.fn().mockResolvedValue(Assets.blocks[0]);

            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default"
            }

            let promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default"
            }

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            let promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
        });
    });

    describe("restore", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let promise = database.restore(Assets.metaData, {truncate: true});

            await expect(promise).toResolve();
        });

        it("should resolve with empty result", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.sync = jest.fn();

            let promise = database.restore(Assets.metaData, {truncate: true});

            await expect(promise).toResolve();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            let promise = database.restore(Assets.metaData, {truncate: true});

            await expect(promise).rejects.toThrow();
        });
    });

    describe("verify", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let promise = database.verify(Assets.metaData);

            await expect(promise).toResolve();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            let promise = database.verify(Assets.metaData);

            await expect(promise).rejects.toThrow();
        });
    });
});
