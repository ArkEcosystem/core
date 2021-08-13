import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { SuggestCommand } from "@packages/core-cli/src/plugins/suggest";
import { blue, red } from "kleur";
import prompts from "prompts";

let cli;
let cmd;
beforeEach(() => {
    cli = new Console();
    cmd = cli.app.resolve(SuggestCommand);
});

describe("SuggestCommand", () => {
    it("should immediately return if there is no signature", async () => {
        expect(await cmd.execute({ signature: "", signatures: [], bin: "ark" })).toBeUndefined();
    });

    it("should immediately return if there are no signatures", async () => {
        expect(await cmd.execute({ signature: "topic:command", signatures: [], bin: "ark" })).toBeUndefined();
    });

    it("should update the bin help if a topic is found", async () => {
        const spyWarning = jest.spyOn(cli.app.get(Container.Identifiers.Warning), "render");

        prompts.inject([true]);

        await cmd.execute({ signature: "topic:command", signatures: ["topic:command1"], bin: "ark" });

        expect(spyWarning).toHaveBeenCalledWith(`${red("topic:command")} is not a ark command.`);
    });

    it("should throw if suggestion is not confirmed", async () => {
        const spyInfo = jest.spyOn(cli.app.get(Container.Identifiers.Info), "render");

        prompts.inject([false]);

        await cmd.execute({
            signature: "topic:command",
            signatures: ["topic:command1"],
            bin: "ark",
        });

        expect(spyInfo).toHaveBeenCalledWith(`Run ${blue("ark help")} for a list of available commands.`);
    });
});
