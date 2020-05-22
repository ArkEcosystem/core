import "jest-extended";

import { Console } from "@packages/core-test-framework/src";
import { Command } from "@packages/core/src/commands/plugin-remove";
import fs from "fs-extra";

let cli;
beforeEach(() => {
    cli = new Console();
});

describe("PluginRemoveCommand", () => {
    it("should throw when the plugin doesn't exist", async () => {
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow(`The package [undefined] does not exist.`);
    });

    it("if the plugin exists, it should be removed", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const removeSync = jest.spyOn(fs, "removeSync");

        await expect(cli.execute(Command)).toResolve();
        expect(removeSync).toHaveBeenCalled();
    });
});
