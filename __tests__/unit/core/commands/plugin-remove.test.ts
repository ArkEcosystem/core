import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-remove";

let cli;
beforeEach(() => {
    cli = new Console();
});

describe("PluginRemoveCommand", () => {
    it("should throw when the plugin doesn't exist", async () => {
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow(`The package [undefined] does not exist.`);
    });

    it.todo("should execute succesfully");
});
