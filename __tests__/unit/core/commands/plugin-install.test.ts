import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-install";
import { Container } from "@packages/core-cli";

let cli;
let spyOnInstall;
const packageName = "dummyPackageName";
const token = "ark";
const network = "testnet";

beforeEach(() => {
    process.argv = ["", "test"];

    cli = new Console();
    const pluginManager = cli.app.get(Container.Identifiers.PluginManager);
    spyOnInstall = jest.spyOn(pluginManager, "install").mockImplementation(async () => {});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("PluginInstallCommand", () => {
    it("should throw an error when package name is not provided", async () => {
        await expect(cli.execute(Command)).rejects.toThrow(`"package" is required`);

        expect(spyOnInstall).not.toHaveBeenCalled();
    });

    it("should call install", async () => {
        const version = "3.0.0";
        await expect(cli.withArgs([packageName]).withFlags({ version, token, network }).execute(Command)).toResolve();

        expect(spyOnInstall).toHaveBeenCalledWith(token, network, packageName, version);
    });
});
