import "jest-extended";

import { PluginDiscoverer } from "@packages/core-kernel/src/providers/plugin-discoverer";
import { Sandbox } from "@packages/core-test-framework";
import * as fs from "fs-extra";
import { join } from "path";

jest.mock("fs-extra", () => {
    const originalModule = jest.requireActual("fs-extra");

    return {
        __esModule: true,
        ...originalModule,
    };
});

let sandbox: Sandbox;
let pluginDiscoverer: PluginDiscoverer;

beforeEach(() => {
    sandbox = new Sandbox();
    pluginDiscoverer = sandbox.app.resolve<PluginDiscoverer>(PluginDiscoverer);
});

describe("PluginConfiguration", () => {
    describe("initialize", () => {
        it("should discover packages", async () => {
            jest.spyOn(sandbox.app, "dataPath").mockReturnValue(__dirname);
            const spyOnExistsSync = jest.spyOn(fs, "existsSync");
            const spyOnReadJSONSync = jest.spyOn(fs, "readJSONSync");

            await expect(pluginDiscoverer.initialize()).toResolve();

            expect(spyOnExistsSync).toHaveBeenCalledTimes(3);
            expect(spyOnExistsSync).toHaveBeenCalledWith(expect.toInclude("packages"));
            expect(spyOnExistsSync).toHaveBeenCalledWith(expect.toInclude("plugins"));
            expect(spyOnExistsSync).toHaveBeenCalledWith(expect.toInclude(__dirname));
            expect(spyOnReadJSONSync).toHaveBeenCalledTimes(19);
        });
    });

    describe("get", () => {
        it("should return plugin from packages", async () => {
            jest.spyOn(sandbox.app, "dataPath").mockReturnValue(__dirname);
            await expect(pluginDiscoverer.initialize()).toResolve();

            expect(pluginDiscoverer.get("@arkecosystem/core-kernel")).toEqual({
                name: "@arkecosystem/core-kernel",
                version: expect.toBeString(),
                packageId: join(__dirname, "../../").slice(0, -1),
            });
        });

        it("should return plugin using resolve", () => {
            expect(pluginDiscoverer.get("@arkecosystem/core-kernel")).toEqual({
                name: "@arkecosystem/core-kernel",
                version: expect.toBeString(),
                packageId: "@arkecosystem/core-kernel",
            });
        });

        it("should throw error if plugin is not found", () => {
            expect(() => {
                pluginDiscoverer.get("@arkecosystem/invalid");
            }).toThrowError(`Plugin "@arkecosystem/invalid" cannot be found.`);
        });
    });
});
