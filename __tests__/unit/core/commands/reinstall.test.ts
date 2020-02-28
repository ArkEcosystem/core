import "jest-extended";

import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import prompts from "prompts";

import { Command } from "@packages/core/src/commands/reinstall";

import execa from "../../../../__mocks__/execa";

let cli;
let processManager;
beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);
});

describe("ReinstallCommand", () => {
    it("should reinstall without a prompt if the [--force] flag is used", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        await cli.withFlags({ force: true }).execute(Command);

        expect(sync).toHaveBeenCalledTimes(4); // install > check core > check relay > check forger

        sync.mockReset();
    });

    it("should reinstall with a prompt confirmation", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([true]);

        await cli.execute(Command);

        expect(sync).toHaveBeenCalledTimes(4); // install > check core > check relay > check forger

        sync.mockReset();
    });

    it("should not reinstall without a prompt confirmation", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([false]);

        await expect(cli.execute(Command)).rejects.toThrow("[ERROR] You'll need to confirm the reinstall to continue.");

        expect(sync).not.toHaveBeenCalled();

        sync.mockReset();
    });

    it("should should ask to restart processes if they are online", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([true]); // restart core
        prompts.inject([true]); // restart relay
        prompts.inject([true]); // restart forger

        await cli.withFlags({ force: true }).execute(Command);

        expect(sync).toHaveBeenCalled();
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(3);

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });
});
