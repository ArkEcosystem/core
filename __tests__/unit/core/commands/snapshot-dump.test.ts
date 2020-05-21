import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-dump";
import { Application, Container } from "@packages/core-kernel";
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
        dump: jest.fn(),
    };
    // @ts-ignore
    Application.prototype.get = function (serviceIdentifier) {
        if (serviceIdentifier === Container.Identifiers.SnapshotService) {
            return mockSnapshotService;
        }

        return this.container.get(serviceIdentifier);
    };
});

describe("DumpCommand", () => {
    it("should run dump", async () => {
        await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.dump).toHaveBeenCalled();
    });
});
