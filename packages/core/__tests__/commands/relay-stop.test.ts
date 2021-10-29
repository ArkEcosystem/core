import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/relay-stop";

let cli;
let processManager;
beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);
});

describe("StopCommand", () => {
    it("should throw if the process does not exist", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        await expect(cli.execute(Command)).rejects.toThrow('The "ark-relay" process does not exist.');

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should throw if the process entered an unknown state", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(true);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        await expect(cli.execute(Command)).rejects.toThrow(
            'The "ark-relay" process has entered an unknown state.',
        );

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should throw if the process is stopped", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(true);

        await expect(cli.execute(Command)).rejects.toThrow('The "ark-relay" process is not running.');

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
    });

    it("should stop the process if the [--daemon] flag is not present", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);
        const deleteSpy = jest.spyOn(processManager, "delete").mockImplementation();

        await cli.withFlags({ daemon: true }).execute(Command);

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

        await cli.execute(Command);

        expect(stop).toHaveBeenCalled();

        missing.mockReset();
        isUnknown.mockReset();
        isStopped.mockReset();
        stop.mockReset();
    });
});
