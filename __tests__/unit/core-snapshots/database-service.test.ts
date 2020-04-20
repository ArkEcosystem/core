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
import { Repositories, Models } from "@packages/core-database";
import { Filesystem } from "@packages/core-snapshots/src/filesystem";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";
import { ProgressDispatcher } from "@packages/core-snapshots/src/progress-dispatcher";
import { Assets } from "./__fixtures__";
import { BlockRepository } from "@packages/core-snapshots/src/repositories";

let sandbox: Sandbox;
let database: SnapshotDatabaseService;
let filesystem: Filesystem;

class MockWorker extends EventEmitter {
    public exit() {
        this.emit("exit", {exitCode: 0});
    }

    public message() {
        this.emit("message", 1);
    }

    public error() {
        this.emit("error", new Error());
    }

    public postMessage() {
        this.message();
        this.exit();
    }
    public terminate() {}
}

let mockWorker = new MockWorker();

jest.mock('worker_threads', ()=> {
    return {
        Worker : jest.fn().mockImplementation(() => { return mockWorker })
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
let transactionRepository: Partial<Repositories.AbstractEntityRepository<Models.Transaction>>;
let roundRepository: Partial<Repositories.AbstractEntityRepository<Models.Round>>;
let progressDispatcher: Partial<ProgressDispatcher>;

beforeEach(() => {
    logger = {
        info: jest.fn(),
        error: jest.fn(),
    };

    connection = {
        isConnected: true
    };

    blockRepository = {
        count: jest.fn().mockResolvedValue(1),
        clear: jest.fn(),
        delete : jest.fn(),
        findFirst: jest.fn().mockResolvedValue(Assets.blocks[0] as any),
        findLast: jest.fn().mockResolvedValue(Assets.blocks[0] as any),
        rollbackChain: jest.fn(),
    };

    transactionRepository = {
        count: jest.fn(),
        clear: jest.fn(),
        delete : jest.fn(),
    };

    roundRepository = {
        count: jest.fn(),
        clear: jest.fn(),
        delete : jest.fn(),
    };

    progressDispatcher = {
        start: jest.fn(),
        end: jest.fn(),
        update: jest.fn(),
    };

    sandbox = new Sandbox;

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

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
   // jest.resetAllMocks();
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

            await expect(database.rollbackChain(roundInfo)).toResolve();
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
            await expect(progressDispatcher.update).toHaveBeenCalled();
            await expect(progressDispatcher.start).toHaveBeenCalledTimes(3);
            await expect(progressDispatcher.end).toHaveBeenCalledTimes(3);
        });
    });

    describe("restore", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let promise = database.restore(Assets.metaData);

            await expect(promise).toResolve();
            await expect(progressDispatcher.update).toHaveBeenCalled();
            await expect(progressDispatcher.start).toHaveBeenCalledTimes(3);
            await expect(progressDispatcher.end).toHaveBeenCalledTimes(3);
        });
    });

    describe("verify", () => {
        it("should resolve", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            let promise = database.verify(Assets.metaData);

            await expect(promise).toResolve();
            await expect(progressDispatcher.update).toHaveBeenCalled();
            await expect(progressDispatcher.start).toHaveBeenCalledTimes(3);
            await expect(progressDispatcher.end).toHaveBeenCalledTimes(3);
        });
    });
});
