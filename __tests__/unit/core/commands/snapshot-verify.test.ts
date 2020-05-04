import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-verify";
import { Application, Container } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots"
import { join, resolve } from "path";

let cli;
beforeEach(() => (cli = new Console()));

describe("SnapshotVerifyCommand", () => {
    it("should run verify", async () => {
        ServiceProvider.prototype.register = jest.fn();
        Application.prototype.configPath = jest.fn().mockImplementation((path: string = "") => join(resolve("packages/core/bin/config/testnet/"), path));

        let mockSnapshotService = {
            verify: jest.fn()
        }
        // @ts-ignore
        Application.prototype.get = function (serviceIdentifier) {
            if (serviceIdentifier === Container.Identifiers.SnapshotService) {
                return mockSnapshotService
            }

            return this.container.get(serviceIdentifier);
        }

        await expect(cli.withFlags({blocks: "1-99"}).execute(Command)).toResolve();
        expect(mockSnapshotService.verify).toHaveBeenCalled();
    });
});
