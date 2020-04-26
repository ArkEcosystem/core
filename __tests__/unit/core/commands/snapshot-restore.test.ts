import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-restore";

let cli;
beforeEach(() => (cli = new Console()));

describe("RestoreCommand", () => {
    it("should throw since the command is not implemented", async () => {
        await expect(cli.execute(Command)).rejects.toThrow("[ERROR] This command has not been implemented.");
    });
});
