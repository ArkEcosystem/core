import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/uninstall";

let cli;
beforeEach(() => (cli = new Console()));

describe("UninstallCommand", () => {
    it("should throw since the command is not implemented", async () => {
        await expect(cli.execute(Command)).rejects.toThrow("This command has not been implemented.");
    });
});
