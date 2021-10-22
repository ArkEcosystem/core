import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/plugin-update";
import { Container } from "@arkecosystem/core-cli";

let cli;
let spyOnUpdate;
const packageName = "dummyPackageName";
const token = "ark";
const network = "testnet";

beforeEach(() => {
    cli = new Console();

    const pluginManager = cli.app.get(Container.Identifiers.PluginManager);
    spyOnUpdate = jest.spyOn(pluginManager, "update").mockImplementation(async () => {});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("PluginUpdateCommand", () => {
    it("should throw when package name is not provided", async () => {
        await expect(cli.execute(Command)).rejects.toThrow(`"package" is required`);

        expect(spyOnUpdate).not.toHaveBeenCalled();
    });

    it("should call update", async () => {
        await expect(cli.withArgs([packageName]).withFlags({ token, network }).execute(Command)).toResolve();

        expect(spyOnUpdate).toHaveBeenCalledWith(token, network, packageName);
    });
});
