import { Console } from "@arkecosystem/core-test-framework";
import { PluginManager } from "@packages/core-cli/src/services";
import fs from "fs-extra";
import { join } from "path";
import { setGracefulCleanup } from "tmp";

const token = "ark";
const network = "testnet";
const packageName = "dummyPackageName";
const install = jest.fn();
const exists = jest.fn().mockReturnValue(false);

let npmUpdateCalled = false;
let gitUpdateCalled = false;
const updateNPM = () => (npmUpdateCalled = true);
const updateGIT = () => (gitUpdateCalled = true);

jest.mock("@packages/core-cli/src/services/source-providers/npm", () => ({
    NPM: jest.fn().mockImplementation(() => ({
        exists,
        install,
        update: updateNPM,
    })),
}));

jest.mock("@packages/core-cli/src/services/source-providers/git", () => ({
    Git: jest.fn().mockImplementation(() => ({
        exists,
        install,
        update: updateGIT,
    })),
}));

jest.mock("@packages/core-cli/src/services/source-providers/file", () => ({
    File: jest.fn().mockImplementation(() => ({
        exists,
        install,
    })),
}));

let cli;
let pluginManager;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    gitUpdateCalled = false;
    npmUpdateCalled = false;

    cli = new Console();

    pluginManager = cli.app.resolve(PluginManager);
});

describe("DiscoverPlugins", () => {
    describe("discover", () => {
        it("should discover packages containing package.json", async () => {
            const pluginsPath: string = join(__dirname, "./plugins");

            jest.spyOn(pluginManager, "getPluginsPath").mockReturnValue(pluginsPath);

            const plugins = await pluginManager.list(token, network);

            expect(plugins).toEqual([
                {
                    name: "@namespace/package2",
                    path: join(pluginsPath, "/@namespace/package2"),
                    version: "2.0.0",
                },
                {
                    name: "package1",
                    path: join(pluginsPath, "/package1"),
                    version: "1.0.0",
                },
            ]);
        });

        it("should return empty array if path doesn't exist", async () => {
            const plugins = await pluginManager.list(token, "undefined");

            expect(plugins).toEqual([]);
        });
    });

    describe("install", () => {
        it("should throw an error when package doesn't exist", async () => {
            const errorMessage = `The given package [${packageName}] is neither a git nor a npm package.`;
            await expect(pluginManager.install(token, network, packageName)).rejects.toThrow(errorMessage);

            expect(exists).toHaveBeenCalledWith(packageName, undefined);
            expect(install).not.toHaveBeenCalled();
        });

        it("should call install on existing packages", async () => {
            exists.mockReturnValue(true);

            await expect(pluginManager.install(token, network, packageName)).toResolve();

            expect(exists).toHaveBeenCalledWith(packageName, undefined);
            expect(install).toHaveBeenCalledWith(packageName, undefined);
        });

        it("should call install on existing packages with version", async () => {
            exists.mockReturnValue(true);

            const version = "3.0.0";
            await expect(pluginManager.install(token, network, packageName, version)).toResolve();

            expect(exists).toHaveBeenCalledWith(packageName, version);
            expect(install).toHaveBeenCalledWith(packageName, version);
        });
    });

    describe("update", () => {
        it("should throw when the plugin doesn't exist", async () => {
            await expect(pluginManager.update(token, network, packageName)).rejects.toThrow(
                `The package [${packageName}] does not exist.`,
            );
        });

        it("if the plugin is a git directory, it should be updated", async () => {
            expect(gitUpdateCalled).toEqual(false);

            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(true);

            await expect(pluginManager.update(token, network, packageName)).toResolve();
            expect(gitUpdateCalled).toEqual(true);
        });

        it("if the plugin is a NPM package, it should be updated on default path", async () => {
            expect(npmUpdateCalled).toEqual(false);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);

            await expect(pluginManager.update(token, network, packageName)).toResolve();
            expect(npmUpdateCalled).toEqual(true);
        });
    });

    describe("remove", () => {
        it("should throw when the plugin doesn't exist", async () => {
            await expect(pluginManager.remove(token, network, packageName)).rejects.toThrow(
                `The package [${packageName}] does not exist.`,
            );
        });

        it("remove plugin if exist", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            const removeSync = jest.spyOn(fs, "removeSync");

            await expect(pluginManager.remove(token, network, packageName)).toResolve();
            expect(removeSync).toHaveBeenCalled();
        });
    });
});
