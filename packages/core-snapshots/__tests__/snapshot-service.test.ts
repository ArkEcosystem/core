import "jest-extended";

import { Container } from "@packages/core-kernel";
import { SnapshotDatabaseService } from "@packages/core-snapshots/src/database-service";
import { Filesystem } from "@packages/core-snapshots/src/filesystem/filesystem";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { SnapshotService } from "@packages/core-snapshots/src/snapshot-service";
import { Sandbox } from "@packages/core-test-framework";

import { Assets } from "./__fixtures__";

let sandbox: Sandbox;
let snapshotService: SnapshotService;

let logger;
let database: Partial<SnapshotDatabaseService>;
let filesystem: Partial<Filesystem>;

beforeEach(() => {
    logger = {
        info: jest.fn(),
        error: jest.fn(),
    };

    database = {
        init: jest.fn(),
        truncate: jest.fn().mockResolvedValue({}),
        dump: jest.fn().mockResolvedValue({}),
        restore: jest.fn().mockResolvedValue({}),
        verify: jest.fn().mockResolvedValue({}),
        rollback: jest.fn().mockResolvedValue({ data: Assets.blocksBigNumber[1] }),
        getLastBlock: jest.fn().mockResolvedValue({ data: Assets.blocksBigNumber[1] }),
    };

    filesystem = {
        setSnapshot: jest.fn(),
        getSnapshotPath: jest.fn(),
        readMetaData: jest.fn().mockResolvedValue(Assets.metaData),
        snapshotExists: jest.fn().mockResolvedValue(true),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.SnapshotService).to(SnapshotService).inSingletonScope();

    sandbox.app.bind(Identifiers.SnapshotFilesystem).toConstantValue(filesystem);
    sandbox.app.bind(Identifiers.SnapshotDatabaseService).toConstantValue(database);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue({});
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue({});
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue({});

    snapshotService = sandbox.app.get<SnapshotService>(Container.Identifiers.SnapshotService);
    filesystem = sandbox.app.get<Filesystem>(Identifiers.SnapshotFilesystem);
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("SnapshotService", () => {
    describe("dump", () => {
        it("should be ok", async () => {
            const options = {
                network: "testnet",
            };

            await expect(snapshotService.dump(options)).toResolve();

            expect(database.dump).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should log error if error in dump", async () => {
            database.dump = jest.fn().mockRejectedValue(new Error());

            const options = {
                network: "testnet",
            };

            await expect(snapshotService.dump(options)).toResolve();

            expect(database.dump).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("restore", () => {
        it("should be ok", async () => {
            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.restore(options)).toResolve();

            expect(database.restore).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should log error if error in restore", async () => {
            database.restore = jest.fn().mockRejectedValue(new Error());

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.restore(options)).toResolve();

            expect(database.restore).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if snapshot does not exist", async () => {
            filesystem.snapshotExists = jest.fn().mockResolvedValue(false);

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.restore(options)).toResolve();

            expect(database.restore).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if meta data cannot be read", async () => {
            filesystem.readMetaData = jest.fn().mockRejectedValue(new Error());

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.restore(options)).toResolve();

            expect(database.restore).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("verify", () => {
        it("should be ok", async () => {
            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.verify(options)).toResolve();

            expect(database.verify).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should log error if snapshot does not exist", async () => {
            filesystem.snapshotExists = jest.fn().mockResolvedValue(false);

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.verify(options)).toResolve();

            expect(database.verify).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if meta cannot be read", async () => {
            filesystem.readMetaData = jest.fn().mockRejectedValue(new Error());

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.verify(options)).toResolve();

            expect(database.verify).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if error on verify", async () => {
            database.verify = jest.fn().mockRejectedValue(new Error());

            const options = {
                network: "testnet",
                blocks: "1-99",
            };

            await expect(snapshotService.verify(options)).toResolve();

            expect(database.verify).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("rollback by height", () => {
        it("should be ok", async () => {
            await expect(snapshotService.rollbackByHeight(1)).toResolve();

            expect(database.rollback).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should log error if height is not valid", async () => {
            await expect(snapshotService.rollbackByHeight(0)).toResolve();

            expect(database.rollback).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if height greater than last block height", async () => {
            await expect(snapshotService.rollbackByHeight(100)).toResolve();

            expect(database.rollback).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });

        it("should log error if error in rollback", async () => {
            database.rollback = jest.fn().mockRejectedValue(new Error());

            await expect(snapshotService.rollbackByHeight(1)).toResolve();

            expect(database.rollback).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("rollback by number", () => {
        it("should be ok", async () => {
            await expect(snapshotService.rollbackByNumber(1)).toResolve();

            expect(database.rollback).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe("truncate", () => {
        it("should be ok", async () => {
            await expect(snapshotService.truncate()).toResolve();

            expect(database.truncate).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).not.toHaveBeenCalled();
        });

        it("should log error if error in truncate", async () => {
            database.truncate = jest.fn().mockRejectedValue(new Error());

            await expect(snapshotService.truncate()).toResolve();

            expect(database.truncate).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();
        });
    });
});
