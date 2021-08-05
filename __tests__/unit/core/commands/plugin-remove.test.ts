import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-remove";
import fs from "fs-extra";

const packageName = "dummyPackageName";

let cli;
beforeEach(() => {
    cli = new Console();
});

afterEach(() => {
    jest.clearAllMocks();
})

describe("PluginRemoveCommand", () => {
    it("should throw when package name is not provided", async () => {
        jest.spyOn(cli.app, "getCorePath").mockReturnValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow(`"package" is required`);
    });

    it("should throw when the plugin doesn't exist", async () => {
        jest.spyOn(cli.app, "getCorePath").mockReturnValueOnce(null);
        await expect(cli.withArgs([packageName]).execute(Command)).rejects.toThrow(
            `The package [${packageName}] does not exist.`,
        );
    });

    it("remove plugin if exist on default path", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const removeSync = jest.spyOn(fs, "removeSync");

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(removeSync).toHaveBeenCalled();

        expect(removeSync.mock.calls[0][0]).toContain(`plugins/${packageName}`);
    });

    it("remove plugin if exist on custom path", async () => {
        process.env.CORE_PLUGINS_PATH="/custom/path"

        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const removeSync = jest.spyOn(fs, "removeSync");

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(removeSync).toHaveBeenCalled();

        expect(removeSync.mock.calls[0][0]).toEqual(`/custom/path/${packageName}`);

        delete process.env.CORE_PLUGINS_PATH
    });
});
