import "jest-extended";

import { Container, Contracts } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { SnapshotService } from "@packages/core-snapshots/src/snapshot-service";
import { Identifiers } from "@packages/core-snapshots/src/ioc";

let sandbox: Sandbox;
let snapshotService: SnapshotService;

let logger = {
    info: jest.fn(),
    error: jest.fn(),
};

let database: Partial<Contracts.Snapshot.DatabaseService> = {
    truncate: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox;

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.SnapshotService).to(SnapshotService).inSingletonScope();

    sandbox.app.bind(Identifiers.SnapshotDatabaseService).toConstantValue(database);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue({});
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue({});
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue({});

    snapshotService = sandbox.app.get<SnapshotService>(Container.Identifiers.SnapshotService);
});

afterEach(() => {
   jest.resetAllMocks();
});

describe("SnapshotService", () => {

    describe("dump", () => {
        it("", async () => {
            await expect(snapshotService.dump()).toResolve();
        });
    });

    describe("restore", () => {
        it("", async () => {
            await expect(snapshotService.restore()).toResolve();
        });
    });

    describe("rollback", () => {
        it("", async () => {
            await expect(snapshotService.rollback()).toResolve();
        });
    });

    describe("truncate", () => {
        it("should truncate blocks, transactions and rounds", async () => {
            await expect(snapshotService.truncate()).toResolve();

            expect(database.truncate).toHaveBeenCalled();
        });
    });

    describe("verify", () => {
        it("", async () => {
            await expect(snapshotService.verify()).toResolve();
        });
    });
});
