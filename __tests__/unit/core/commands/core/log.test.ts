import { CLIError } from "@oclif/errors";
import { LogCommand } from "@packages/core/src/commands/core/log";

describe("LogCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(LogCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-core" process does not exist.'),
        );
    });
});
