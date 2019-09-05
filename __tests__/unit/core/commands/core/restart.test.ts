import { CLIError } from "@oclif/errors";
import { RestartCommand } from "@packages/core/src/commands/core/restart";
import { processManager } from "@packages/core/src/common/process-manager";

describe("RestartCommand", () => {
    it("should throw if the process does not exist", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(true);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        await expect(RestartCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-core" process does not exist.'),
        );

        missing.mockReset();
        isStopped.mockReset();
    });

    it("should throw if the process is stopped", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(true);

        await expect(RestartCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-core" process is not running.'),
        );

        missing.mockReset();
        isStopped.mockReset();
    });

    it("should restart the process", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);
        const restart = jest.spyOn(processManager, "restart").mockImplementation();

        await RestartCommand.run(["--token=ark", "--network=testnet"]);

        expect(restart).toHaveBeenCalled();

        missing.mockReset();
        isStopped.mockReset();
        restart.mockReset();
    });
});
