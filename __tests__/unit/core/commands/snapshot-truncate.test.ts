import { Application, Container } from "@arkecosystem/core-kernel";
import { Console } from "@arkecosystem/core-test-framework/src";
import { ServiceProvider } from "@packages/core-snapshots";
import { Command } from "@packages/core/src/commands/snapshot-truncate";
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
        truncate: jest.fn(),
    };
    // @ts-ignore
    Application.prototype.get = function (serviceIdentifier) {
        if (serviceIdentifier === Container.Identifiers.SnapshotService) {
            return mockSnapshotService;
        }

        return this.container.get(serviceIdentifier);
    };
});

describe("SnapshotTruncateCommand", () => {
    it("should run truncate", async () => {
        await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.truncate).toHaveBeenCalled();
    });
});
