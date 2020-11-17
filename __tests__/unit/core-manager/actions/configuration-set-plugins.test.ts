import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/configuration-set-plugins";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;
import fs from "fs-extra";

const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

beforeEach(() => {
    sandbox = new Sandbox();

    action = sandbox.app.resolve(Action);

    sandbox.app.configPath = jest.fn().mockReturnValue("/path/to/file");
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Configuration:SetPlugins", () => {
    it("should have name", () => {
        expect(action.name).toEqual("configuration.setPlugins");
    });

    it("should validate and save configuration", async () => {
        const params = { core: { plugins: [{ package: "@arkecosystem/core-manager" }] } };

        const result = await action.execute(params);

        expect(result).toEqual({});
        expect(writeJSONSync).toHaveBeenCalledWith("/path/to/file", params, { spaces: 4 });
    });

    it("should throw error - plugins keys are missing", async () => {
        const params = { core: {} };
        await expect(action.execute(params)).rejects.toThrow("core plugins array is missing");

        expect(writeJSONSync).not.toHaveBeenCalled();
    });

    it("should throw error - plugin is not an abject", async () => {
        const params = { core: { plugins: [{ package: 123 }] } };
        await expect(action.execute(params)).rejects.toThrow("Package is not a string");

        expect(writeJSONSync).not.toHaveBeenCalled();
    });
});
