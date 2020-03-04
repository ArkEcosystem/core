import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { RestartRunningProcessWithPrompt } from "@packages/core-cli/src/actions";
import prompts from "prompts";

const processName: string = "ark-core";

let cli;
let processManager;
let action;

beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);

    // Bind from src instead of dist to collect coverage.
    cli.app
        .rebind(Container.Identifiers.RestartRunningProcessWithPrompt)
        .to(RestartRunningProcessWithPrompt)
        .inSingletonScope();
    action = cli.app.get(Container.Identifiers.RestartRunningProcessWithPrompt);
});

describe("RestartRunningProcessWithPrompt", () => {
    it("should not restart the process if it is not online", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await action.execute(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).not.toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });

    it("should restart the process", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([true]);

        await action.execute(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });

    it("should not restart the process if it is not confirmed", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([false]);

        await action.execute(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).not.toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });
});
