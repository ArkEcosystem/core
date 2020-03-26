import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-install";
import { File } from "@packages/core/src/source-providers/file";
import { Git } from "@packages/core/src/source-providers/git";
import { NPM } from "@packages/core/src/source-providers/npm";
import { setGracefulCleanup } from "tmp";

jest.mock("@packages/core/src/source-providers/npm");
jest.mock("@packages/core/src/source-providers/file");
jest.mock("@packages/core/src/source-providers/git");

let cli;
beforeEach(() => {
    process.argv = ["", "test"];

    cli = new Console();
});

afterEach(() => {
    jest.clearAllMocks();
    setGracefulCleanup();
});

describe("PluginInstallCommand", () => {
    it("should throw when the package is unknown", async () => {
        await expect(cli.execute(Command)).rejects.toThrow(
            `The given package [undefined] is neither a git nor a npm package.`,
        );
    });

    it.skip("should successfully install the plugin", async () => {
        expect(NPM).not.toHaveBeenCalled();
        expect(Git).not.toHaveBeenCalled();
        expect(File).not.toHaveBeenCalled();

        const pluginName = "@arkecosystem/utils";
        // TODO: currently arguments are unable to be passed to a command
        await cli.execute(Command);

        // @ts-ignore
        const mockNPMInstance = NPM.mock.instances[0];
        const mockNPMExists = mockNPMInstance.exists;
        const mockNPMInstall = mockNPMInstance.install;
        // @ts-ignore
        const mockGitInstance = Git.mock.instances[0];
        const mockGitExists = mockGitInstance.exists;
        const mockGitInstall = mockGitInstance.install;
        // @ts-ignore
        const mockFileInstance = File.mock.instances[0];
        const mockFileExists = mockFileInstance.exists;
        const mockFileInstall = mockFileInstance.install;

        expect(mockNPMExists).toHaveBeenCalledWith(pluginName);
        expect(mockNPMInstall).toHaveBeenCalledWith(pluginName);

        expect(mockGitExists).toHaveBeenCalledWith(pluginName);
        expect(mockGitInstall).toHaveBeenCalledWith(pluginName);

        expect(mockFileExists).toHaveBeenCalledWith(pluginName);
        expect(mockFileInstall).toHaveBeenCalledWith(pluginName);
    });
});
