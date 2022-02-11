import { Command } from "@packages/core/src/commands/update";
import { Container } from "@packages/core-cli";
import { ActionFactory } from "@packages/core-cli/src/action-factory";
import { Updater } from "@packages/core-cli/src/services/updater";
import { Console } from "@packages/core-test-framework";

let cli;
let updater: Partial<Updater>;
let actionFactory: Partial<ActionFactory>;

beforeEach(() => {
    updater = {
        check: jest.fn().mockResolvedValue(true),
        update: jest.fn(),
    };

    actionFactory = {
        restartRunningProcess: jest.fn(),
        restartRunningProcessWithPrompt: jest.fn(),
    };

    cli = new Console();
    cli.app.rebind(Container.Identifiers.Updater).toConstantValue(updater);
    cli.app.rebind(Container.Identifiers.ActionFactory).toConstantValue(actionFactory);
});

describe("UpdateCommand", () => {
    it("should not update if check returns false", async () => {
        updater.check = jest.fn().mockResolvedValue(false);

        await cli.execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update with a prompts", async () => {
        await cli.execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, false);
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).toHaveBeenCalledTimes(3);
    });

    it("should update without a prompt if the [--force] flag is present", async () => {
        await cli.withFlags({ force: true, updateProcessManager: false }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, true);
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update and update process manager without a prompt if the [--force --updateProcessManager] flag is present", async () => {
        await cli.withFlags({ force: true, updateProcessManager: true }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(true, true);
        expect(actionFactory.restartRunningProcess).not.toHaveBeenCalled();
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update and restart without a prompt if the [--force --restart] flag is present", async () => {
        await cli.withFlags({ force: true, restart: true }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, true);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledTimes(3);
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update and restart core without a prompt if the [--force --restartCore] flag is present", async () => {
        await cli.withFlags({ force: true, restartCore: true }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, true);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledTimes(1);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledWith("ark-core");
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update and restart relay without a prompt if the [--force --restartRelay] flag is present", async () => {
        await cli.withFlags({ force: true, restartRelay: true }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, true);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledTimes(1);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledWith("ark-relay");
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });

    it("should update and restart forger without a prompt if the [--force --restartForger] flag is present", async () => {
        await cli.withFlags({ force: true, restartForger: true }).execute(Command);

        expect(updater.check).toHaveBeenCalled();
        expect(updater.update).toHaveBeenCalledWith(false, true);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledTimes(1);
        expect(actionFactory.restartRunningProcess).toHaveBeenCalledWith("ark-forger");
        expect(actionFactory.restartRunningProcessWithPrompt).not.toHaveBeenCalled();
    });
});
