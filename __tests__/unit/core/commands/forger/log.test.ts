import { CLIError } from "@oclif/errors";
import { LogCommand } from "@packages/core/src/commands/forger/log";

describe("LogCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(LogCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-forger" process does not exist.'),
        );
    });
});
