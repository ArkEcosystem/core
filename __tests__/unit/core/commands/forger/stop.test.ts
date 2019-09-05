import { CLIError } from "@oclif/errors";
import { StopCommand } from "@packages/core/src/commands/forger/stop";
import { processManager } from "@packages/core/src/common/process-manager";

describe("StopCommand", () => {
    it("should throw if the process does not exist", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        await expect(StopCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-forger" process does not exist.'),
        );

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should throw if the process entered an unknown state", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(true);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        await expect(StopCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-forger" process has entered an unknown state.'),
        );

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should throw if the process is stopped", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(true);

        await expect(StopCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-forger" process is not running.'),
        );

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should stop the process if the [--daemon] flag is not present", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);
        const deleteSpy = jest.spyOn(processManager, "delete").mockImplementation();

        await StopCommand.run(["--token=ark", "--network=testnet", "--daemon"]);

        expect(deleteSpy).toHaveBeenCalled();

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
        deleteSpy.mockReset();
    });

    it("should delete the process if the [--daemon] flag is present", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);
        const stop = jest.spyOn(processManager, "stop").mockImplementation();

        await StopCommand.run(["--token=ark", "--network=testnet"]);

        expect(stop).toHaveBeenCalled();

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
        stop.mockReset();
    });
});
