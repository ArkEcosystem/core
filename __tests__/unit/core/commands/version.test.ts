import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/version";

let cli;
beforeEach(() => (cli = new Console()));

describe("VersionCommand", () => {
    it("should throw since the command is not implemented", async () => {
        const spyConsoleLog = jest.spyOn(console, "log");

        await cli.execute(Command);
        expect(spyConsoleLog).toHaveBeenCalledWith(cli.pkg.version);
    });
});
