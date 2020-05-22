import "jest-extended";

import { Console } from "@packages/core-test-framework/src";
import { Command } from "@packages/core/src/commands/plugin-update";
import fs from "fs-extra";

let npmUpdateCalled = false;
let gitUpdateCalled = false;
const updateNPM = () => (npmUpdateCalled = true);
const updateGIT = () => (gitUpdateCalled = true);

jest.mock("@packages/core/src/source-providers/npm", () => ({
    NPM: jest.fn().mockImplementation(() => ({
        update: updateNPM,
    })),
}));

jest.mock("@packages/core/src/source-providers/git", () => ({
    Git: jest.fn().mockImplementation(() => ({
        update: updateGIT,
    })),
}));

let cli;
beforeEach(() => {
    cli = new Console();
});

describe("PluginUpdateCommand", () => {
    it("should throw when the plugin doesn't exist", async () => {
        jest.spyOn(cli.app, "getCorePath").mockResolvedValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow(`The package [undefined] does not exist.`);
    });

    it("if the plugin is a git directory, it should be updated", async () => {
        expect(gitUpdateCalled).toEqual(false);

        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(true);

        await expect(cli.execute(Command)).toResolve();
        expect(gitUpdateCalled).toEqual(true);
    });

    it("if the plugin is a NPM package, it should be updated", async () => {
        expect(npmUpdateCalled).toEqual(false);
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);

        await expect(cli.execute(Command)).toResolve();
        expect(npmUpdateCalled).toEqual(true);
    });
});
