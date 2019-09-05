import "jest-extended";

import { ReinstallCommand } from "@packages/core/src/commands/reinstall";
import { processManager } from "@packages/core/src/common/process-manager";
import prompts from "prompts";
import execa from "../../../../__mocks__/execa";

describe("ReinstallCommand", () => {
    it("should reinstall without a prompt if the [--force] flag is used", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        await ReinstallCommand.run(["--force"]);

        expect(sync).toHaveBeenCalledTimes(4); // install > check core > check relay > check forger

        sync.mockReset();
    });

    it("should reinstall with a prompt confirmation", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([true]);

        await ReinstallCommand.run([]);

        expect(sync).toHaveBeenCalledTimes(4); // install > check core > check relay > check forger

        sync.mockReset();
    });

    it("should not reinstall without a prompt confirmation", async () => {
        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([false]);

        await ReinstallCommand.run([]);

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

        await ReinstallCommand.run(["--force"]);

        expect(sync).toHaveBeenCalled();
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(3);

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });
});
