import { Command } from "@packages/core/src/commands/reinstall";
import { ActionFactory, Container } from "@packages/core-cli";
import { Installer, ProcessManager } from "@packages/core-cli/src/services";
import { Console } from "@packages/core-test-framework";
import prompts from "prompts";

let cli;
let processManager: Partial<ProcessManager>;
let installer: Partial<Installer>;
let actionFactory: Partial<ActionFactory>;

beforeEach(() => {
    installer = {
        install: jest.fn(),
    };

    processManager = {
        update: jest.fn(),
    };

    actionFactory = {
        restartRunningProcess: jest.fn(),
        restartRunningProcessWithPrompt: jest.fn(),
    };

    cli = new Console();
    cli.app.rebind(Container.Identifiers.Installer).toConstantValue(installer);
    cli.app.rebind(Container.Identifiers.ProcessManager).toConstantValue(processManager);
    cli.app.rebind(Container.Identifiers.ActionFactory).toConstantValue(actionFactory);
});

describe("ReinstallCommand", () => {
    it("should reinstall without a prompt if the [--force] flag is used", async () => {
        await cli.withFlags({ force: true }).execute(Command);

        expect(installer.install).toHaveBeenCalled();
        expect(processManager.update).toHaveBeenCalled();
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledTimes(3);
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should reinstall with a prompt confirmation", async () => {
        prompts.inject([true]);

        await cli.execute(Command);

        expect(installer.install).toHaveBeenCalled();
        expect(processManager.update).toHaveBeenCalled();
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).toHaveBeenCalledTimes(3);
    });

    it("should not reinstall without a prompt confirmation", async () => {
        prompts.inject([false]);

        await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the reinstall to continue.");

        expect(installer.install).not.toHaveBeenCalled();
        expect(processManager.update).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });
});
