import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/forger-log";

let cli;
beforeEach(() => (cli = new Console()));

describe("LogCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(cli.execute(Command)).rejects.toThrow('[ERROR] The "ark-forger" process does not exist.');
    });
});
