import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-update";
import { Git, NPM } from "@packages/core/src/source-providers";
import fs from "fs-extra";

let npmUpdateCalled = false;
let gitUpdateCalled = false;
const packageName = "dummyPackageName";
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
    gitUpdateCalled = false;
    npmUpdateCalled = false;

    cli = new Console();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("PluginUpdateCommand", () => {
    it("should throw when package name is not provided", async () => {
        jest.spyOn(cli.app, "getCorePath").mockReturnValueOnce(null);
        await expect(cli.execute(Command)).rejects.toThrow(`"package" is required`);
    });

    it("should throw when the plugin doesn't exist", async () => {
        jest.spyOn(cli.app, "getCorePath").mockReturnValueOnce(__dirname);
        await expect(cli.withArgs([packageName]).execute(Command)).rejects.toThrow(
            `The package [${packageName}] does not exist.`,
        );
    });

    it("if the plugin is a git directory, it should be updated on default path", async () => {
        expect(gitUpdateCalled).toEqual(false);

        const spyOnExistSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(true);

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(gitUpdateCalled).toEqual(true);

        expect(spyOnExistSync.mock.calls[0][0]).toContain(`plugins/${packageName}`);
        expect(spyOnExistSync.mock.calls[1][0]).toContain(`plugins/${packageName}/.git`);
        // @ts-ignore
        expect(Git.mock.calls[0][0].data).toContain("plugins");
        // @ts-ignore
        expect(Git.mock.calls[0][0].temp).toContain("plugins");
    });

    it("if the plugin is a git directory, it should be updated on custom path", async () => {
        process.env.CORE_PLUGINS_PATH = "/custom/path";

        expect(gitUpdateCalled).toEqual(false);

        const spyOnExistSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(true);

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(gitUpdateCalled).toEqual(true);

        expect(spyOnExistSync.mock.calls[0][0]).toEqual(`/custom/path/${packageName}`);
        expect(spyOnExistSync.mock.calls[1][0]).toEqual(`/custom/path/${packageName}/.git`);
        // @ts-ignore
        expect(Git.mock.calls[0][0].data).toEqual(`/custom/path`);
        // @ts-ignore
        expect(Git.mock.calls[0][0].temp).toContain("plugins");

        delete process.env.CORE_PLUGINS_PATH;
    });

    it("if the plugin is a NPM package, it should be updated on default path", async () => {
        expect(npmUpdateCalled).toEqual(false);
        const spyOnExistSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(npmUpdateCalled).toEqual(true);

        expect(spyOnExistSync.mock.calls[0][0]).toContain("plugins");
        expect(spyOnExistSync.mock.calls[1][0]).toContain("plugins");
        // @ts-ignore
        expect(NPM.mock.calls[0][0].data).toContain("plugins");
        // @ts-ignore
        expect(NPM.mock.calls[0][0].temp).toContain("plugins");
    });

    it("if the plugin is a NPM package, it should be updated on custom path", async () => {
        process.env.CORE_PLUGINS_PATH = "/custom/path";

        expect(npmUpdateCalled).toEqual(false);
        const spyOnExistSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);

        await expect(cli.withArgs([packageName]).execute(Command)).toResolve();
        expect(npmUpdateCalled).toEqual(true);

        expect(spyOnExistSync.mock.calls[0][0]).toEqual(`/custom/path/${packageName}`);
        expect(spyOnExistSync.mock.calls[1][0]).toEqual(`/custom/path/${packageName}/.git`);
        // @ts-ignore
        expect(NPM.mock.calls[0][0].data).toEqual(`/custom/path`);
        // @ts-ignore
        expect(NPM.mock.calls[0][0].temp).toContain("plugins");

        delete process.env.CORE_PLUGINS_PATH;
    });
});
