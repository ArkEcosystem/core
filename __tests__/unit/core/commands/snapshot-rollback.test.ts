import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/snapshot-rollback";

let cli;
beforeEach(() => (cli = new Console()));

describe("SnapshotRollbackCommand", () => {
    it("should throw since the command is not implemented", async () => {
        await expect(cli.execute(Command)).rejects.toThrow("[ERROR] This command has not been implemented.");
    });
});
