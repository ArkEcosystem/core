import { Console } from "@arkecosystem/core-test-framework";
import { PluginManager } from "@packages/core-cli/src/services";
import { join } from "path";
import { setGracefulCleanup } from "tmp";

const packageName = "dummyPackageName";
const install = jest.fn();
const exists = jest.fn().mockReturnValue(false);

jest.mock("@packages/core-cli/src/services/source-providers/npm", () => ({
    NPM: jest.fn().mockImplementation(() => ({
        exists,
        install,
    })),
}));

jest.mock("@packages/core-cli/src/services/source-providers/git", () => ({
    Git: jest.fn().mockImplementation(() => ({
        exists,
        install,
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
    cli = new Console();

    pluginManager = cli.app.resolve(PluginManager);
});

describe("DiscoverPlugins", () => {
    describe("discover", () => {
        it("should discover packages containing package.json", async () => {
            const pluginsPath: string = join(__dirname, "./plugins");

            jest.spyOn(pluginManager, "getPluginsPath").mockReturnValue(pluginsPath);

            const plugins = await pluginManager.list("ark", "testnet");

            expect(plugins).toEqual([
                {
                    name: "@namespace/package2",
                    path: join(pluginsPath, "/namespace/package2"),
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
            const plugins = await pluginManager.list("ark", "undefined");

            expect(plugins).toEqual([]);
        });
    });

    describe("install", () => {
        it("should throw an error when package doesn't exist", async () => {
            const errorMessage = `The given package [${packageName}] is neither a git nor a npm package.`;
            await expect(pluginManager.install("ark", "testnet", packageName)).rejects.toThrow(errorMessage);

            expect(exists).toHaveBeenCalledWith(packageName, undefined);
            expect(install).not.toHaveBeenCalled();
        });

        it("should call install on existing packages", async () => {
            exists.mockReturnValue(true);

            await expect(pluginManager.install("ark", "testnet", packageName)).toResolve();

            expect(exists).toHaveBeenCalledWith(packageName, undefined);
            expect(install).toHaveBeenCalledWith(packageName, undefined);
        });

        it("should call install on existing packages with version", async () => {
            exists.mockReturnValue(true);

            const version = "3.0.0";
            await expect(pluginManager.install("ark", "testnet", packageName, version)).toResolve();

            expect(exists).toHaveBeenCalledWith(packageName, version);
            expect(install).toHaveBeenCalledWith(packageName, version);
        });
    });
});
