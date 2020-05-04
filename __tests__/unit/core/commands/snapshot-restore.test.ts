import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-restore";
import { Application, Container } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots"
import { join, resolve } from "path";

let cli;
let mockSnapshotService;

beforeEach(() => {
    cli = new Console()

    ServiceProvider.prototype.register = jest.fn();
    Application.prototype.configPath = jest.fn().mockImplementation((path: string = "") => join(resolve("packages/core/bin/config/testnet/"), path));

    mockSnapshotService = {
        restore: jest.fn()
    }
    // @ts-ignore
    Application.prototype.get = function (serviceIdentifier) {
        if (serviceIdentifier === Container.Identifiers.SnapshotService) {
            return mockSnapshotService
        }

        return this.container.get(serviceIdentifier);
    }
});

afterEach(() => {
    jest.clearAllMocks();
})

describe("RestoreCommand", () => {
    it("should run restore", async () => {
        await expect(cli.withFlags({blocks: "1-99"}).execute(Command)).toResolve();
        expect(mockSnapshotService.restore).toHaveBeenCalled();
    });

    it("should not run restore if blocks flag is missing", async () => {
        await expect(cli.execute(Command)).toReject();
    });
});
