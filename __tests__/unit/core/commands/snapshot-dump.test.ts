import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-dump";
import { Application, Container } from "@packages/core-kernel";
import { join, resolve } from "path";

let cli;
beforeEach(() => (cli = new Console()));

describe("DumpCommand", () => {
    it("should run dump", async () => {
        Application.prototype.configPath = jest.fn().mockImplementation((path: string = "") => join(resolve("packages/core/bin/config/testnet/"), path));

        let mockSnapshotService = {
            dump: jest.fn()
        }
        // @ts-ignore
        Application.prototype.get = function (serviceIdentifier) {
            if (serviceIdentifier === Container.Identifiers.SnapshotService) {
                return mockSnapshotService
            }

            return this.container.get(serviceIdentifier);
        }

        console.log(await cli.execute(Command))
        // await expect(cli.execute(Command)).toResolve();
        expect(mockSnapshotService.dump).toHaveBeenCalled();
    });
});
