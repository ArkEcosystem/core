import "jest-extended";

import { Container, Providers } from "@packages/core-kernel";
import { Queue } from "@packages/core-kernel/dist/contracts/kernel";
import { interfaces } from "@packages/core-kernel/dist/ioc";
import { MemoryQueue } from "@packages/core-kernel/dist/services/queue/drivers/memory";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";
import { SnapshotDatabaseService } from "@packages/core-snapshots/src/database-service";
import { Filesystem } from "@packages/core-snapshots/src/filesystem/filesystem";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { ProgressDispatcher } from "@packages/core-snapshots/src/progress-dispatcher";
import { BlockRepository, RoundRepository, TransactionRepository } from "@packages/core-snapshots/src/repositories";
import { Sandbox } from "@packages/core-test-framework";
import { EventEmitter } from "events";
import { dirSync, setGracefulCleanup } from "tmp";
import { Connection } from "typeorm";

import { Assets } from "./__fixtures__";

EventEmitter.prototype.constructor = Object.prototype.constructor;

let sandbox: Sandbox;
let database: SnapshotDatabaseService;
let filesystem: Filesystem;

class MockWorkerWrapper extends EventEmitter {
    public constructor() {
        super();
    }

    public async start() {
        this.emit("count", 1);
        this.emit("exit");
    }

    public async sync() {}
    public async terminate() {}
}

let mockWorkerWrapper;

jest.mock("@packages/core-snapshots/src/workers/worker-wrapper", () => {
    return {
        WorkerWrapper: jest.fn().mockImplementation(() => {
            return mockWorkerWrapper;
        }),
    };
});

const configuration = {
    chunkSize: 50000,
    dispatchUpdateStep: 1000,
    connection: {},
    cryptoPackages: [],
};

let logger;
let connection: Partial<Connection>;
let blockRepository: Partial<BlockRepository>;
let transactionRepository: Partial<TransactionRepository>;
let roundRepository: Partial<RoundRepository>;
let progressDispatcher: Partial<ProgressDispatcher>;
let eventDispatcher;

beforeEach(() => {
    mockWorkerWrapper = new MockWorkerWrapper();
    mockWorkerWrapper.sync = jest.fn().mockResolvedValue({ numberOfTransactions: 1, height: 1 });
    mockWorkerWrapper.terminate = jest.fn();
    mockWorkerWrapper.removeListener = jest.fn();

    logger = {
        info: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
    };

    connection = {
        isConnected: true,
    };

    eventDispatcher = {
        dispatch: jest.fn(),
    };

    const lastBlock = Assets.blocksBigNumber[0];
    lastBlock.height = 100;

    blockRepository = {
        fastCount: jest.fn().mockResolvedValue(1),
        truncate: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(Assets.blocksBigNumber[0] as any),
        findLast: jest.fn().mockResolvedValue(lastBlock as any),
        findByHeight: jest.fn().mockResolvedValue(lastBlock as any),
        rollback: jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5),
    };

    transactionRepository = {
        fastCount: jest.fn(),
        delete: jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5),
    };

    roundRepository = {
        fastCount: jest.fn(),
        delete: jest.fn(),
        countInRange: jest.fn().mockResolvedValue(5),
    };

    progressDispatcher = {
        start: jest.fn(),
        end: jest.fn(),
        update: jest.fn(),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

    sandbox.app.bind(Container.Identifiers.ApplicationNetwork).toConstantValue("testnet");

    sandbox.app.bind(Container.Identifiers.FilesystemService).to(LocalFilesystem).inSingletonScope();
    sandbox.app.bind(Identifiers.SnapshotFilesystem).to(Filesystem).inSingletonScope();

    sandbox.app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(blockRepository);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue(transactionRepository);
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(roundRepository);

    sandbox.app.bind(Identifiers.ProgressDispatcher).toConstantValue(progressDispatcher);

    sandbox.app.bind(Identifiers.SnapshotVersion).toConstantValue("3.0.0-next.0");

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);

    sandbox.app
        .bind(Container.Identifiers.QueueFactory)
        .toFactory((context: interfaces.Context) => async <K, T>(name?: string): Promise<Queue> =>
            sandbox.app.resolve<Queue>(MemoryQueue).make(),
        );

    sandbox.app.bind(Identifiers.SnapshotDatabaseService).to(SnapshotDatabaseService).inSingletonScope();

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .from("@arkecosystem/core-snapshots", configuration);

    database = sandbox.app.get<SnapshotDatabaseService>(Identifiers.SnapshotDatabaseService);
    filesystem = sandbox.app.get<Filesystem>(Identifiers.SnapshotFilesystem);
});

afterEach(() => {
    setGracefulCleanup();
});

describe("DatabaseService", () => {
    describe("init", () => {
        it("should be ok", async () => {
            database.init("default", false, false);
        });

        it("should be ok with default parameters", async () => {
            database.init();
        });
    });

    describe("truncate", () => {
        it("should call delete and clear method on transaction, block and round", async () => {
            await expect(database.truncate()).toResolve();

            expect(blockRepository.truncate).toHaveBeenCalled();
        });
    });

    describe("getLastBlock", () => {
        it("should return block", async () => {
            await expect(database.getLastBlock()).toResolve();
        });
    });

    describe("rollbackChain", () => {
        it("should rollback chain to specific height", async () => {
            const roundInfo = {
                round: 1,
                nextRound: 2,
                maxDelegates: 51,
                roundHeight: 1,
            };

            await expect(database.rollback(roundInfo)).toResolve();
        });
    });

    describe("dump", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            const dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default",
            };

            // await expect(database.dump(dumpOptions)).toResolve();
            await database.dump(dumpOptions);
        });

        it("should throw error if last block is not found", async () => {
            blockRepository.findLast = jest.fn().mockResolvedValue(undefined);

            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            const dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default",
            };

            const promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
        });

        it("should throw error if last and first block are in same range", async () => {
            blockRepository.findLast = jest.fn().mockResolvedValue(Assets.blocks[0]);

            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);
            const spyOnDeleteSnapshot = jest.spyOn(filesystem, "deleteSnapshot");

            const dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default",
            };

            const promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
            expect(spyOnDeleteSnapshot).toHaveBeenCalled();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);
            const spyOnDeleteSnapshot = jest.spyOn(filesystem, "deleteSnapshot");

            const dumpOptions = {
                network: "testnet",
                skipCompression: false,
                codec: "default",
            };

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            const promise = database.dump(dumpOptions);

            await expect(promise).rejects.toThrow();
            expect(spyOnDeleteSnapshot).toHaveBeenCalled();
        });
    });

    describe("restore", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).toResolve();
        });

        it("should resolve without truncate", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            const promise = database.restore(Assets.metaData, { truncate: false });

            await expect(promise).toResolve();
        });

        it("should resolve with empty result", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.sync = jest.fn();

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).toResolve();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).rejects.toThrow();
        });

        it("should throw error if error on sync in blocks worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.sync = jest.fn().mockRejectedValueOnce(new Error("Blocks error"));

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).rejects.toThrow("Blocks error");
        });

        it("should throw error if error on sync in transactions worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.sync = jest
                .fn()
                .mockResolvedValueOnce({ numberOfTransactions: 1, height: 1 })
                .mockRejectedValueOnce(new Error("Transactions error"));

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).rejects.toThrow("Transactions error");
        });

        it("should throw error if error on sync in rounds worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.sync = jest
                .fn()
                .mockResolvedValueOnce({ numberOfTransactions: 1, height: 1 })
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error("Rounds error"));

            const promise = database.restore(Assets.metaData, { truncate: true });

            await expect(promise).rejects.toThrow("Rounds error");
        });
    });

    describe("verify", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            const promise = database.verify(Assets.metaData);

            await expect(promise).toResolve();
        });

        it("should throw error if error in worker", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            mockWorkerWrapper.start = jest.fn().mockRejectedValue(new Error());

            const promise = database.verify(Assets.metaData);

            await expect(promise).rejects.toThrow();
        });
    });
});
