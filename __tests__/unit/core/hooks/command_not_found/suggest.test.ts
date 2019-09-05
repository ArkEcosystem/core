import { init } from "@packages/core/src/hooks/command_not_found/suggest";
import prompts from "prompts";
import Chalk from "chalk";

describe("init", () => {
    it("should immediately return if there are no command IDs", async () => {
        // @ts-ignore
        expect(await init({ id: "topic:command", config: { bin: "ark" } })).toBeUndefined();
    });

    it("should update the bin help if a topic is found", async () => {
        const findTopic = jest.fn().mockReturnValue(true);
        const runCommand = jest.fn();
        const warn = jest.fn();

        prompts.inject([true]);

        // @ts-ignore
        await init.call(
            { warn },
            { id: "topic:command", config: { bin: "ark", commandIDs: ["topic:command1"], findTopic, runCommand } },
        );

        expect(findTopic).toHaveBeenCalledWith("topic");
        expect(runCommand).toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(`${Chalk.redBright("topic:command")} is not a ark command.`);
    });

    it("should throw if suggestion is not confirmed", async () => {
        prompts.inject([false]);

        await expect(
            // @ts-ignore
            init.call(
                { warn: jest.fn() },
                {
                    id: "topic:command",
                    config: { bin: "ark", commandIDs: ["topic:command1"], findTopic: jest.fn(), runCommand: jest.fn() },
                },
            ),
        ).rejects.toThrow(`Run ${Chalk.blueBright("ark help")} for a list of available commands.`);
    });
});
