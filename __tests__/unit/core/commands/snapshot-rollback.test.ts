import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-rollback";
import { Application, Container } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots";
import { join, resolve } from "path";

let cli;
let mockSnapshotService;

beforeEach(() => {
    cli = new Console();

    ServiceProvider.prototype.register = jest.fn();
    Application.prototype.configPath = jest
        .fn()
        .mockImplementation((path: string = "") => join(resolve("packages/core/bin/config/testnet/"), path));

    mockSnapshotService = {
        rollbackByHeight: jest.fn(),
        rollbackByNumber: jest.fn(),
    };
    // @ts-ignore
    Application.prototype.get = function (serviceIdentifier) {
        if (serviceIdentifier === Container.Identifiers.SnapshotService) {
            return mockSnapshotService;
        }

        return this.container.get(serviceIdentifier);
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("SnapshotRollbackCommand", () => {
    it("should run rollback by height", async () => {
        await expect(cli.withFlags({ height: 100 }).execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByHeight).toHaveBeenCalled();
    });

    it("should run rollback by number", async () => {
        await expect(cli.withFlags({ number: 100 }).execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByNumber).toHaveBeenCalled();
    });

    it("should not run rollback if height or number is not provided", async () => {
        await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.rollbackByNumber).not.toHaveBeenCalled();
        expect(mockSnapshotService.rollbackByHeight).not.toHaveBeenCalled();
    });
});
