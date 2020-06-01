import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/configuration-update-plugins";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    put: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);

    sandbox.app.configPath = jest.fn().mockReturnValue("/path/to/file");
});

describe("Configuration:UpdatePlugins", () => {
    it("should have name", () => {
        expect(action.name).toEqual("configuration.updatePlugins");
    });

    it("should validate and save configuration", async () => {
        const content = "module.exports = { '@arkecosystem/core-kernel': {} }";

        const result = await action.execute({ content: content });

        expect(result).toEqual({});
        expect(mockFilesystem.put).toHaveBeenCalledTimes(1);
    });

    it("should throw error - content cannot be resolved", async () => {
        const content = "invalid_file";
        await expect(action.execute({ content: content })).rejects.toThrow("Content cannot be resolved");
    });

    it("should throw error - plugins keys are missing", async () => {
        const content = "module.exports = {}";
        await expect(action.execute({ content: content })).rejects.toThrow("Missing plugin keys");
    });

    it("should throw error - plugin is not an abject", async () => {
        const content = "module.exports = { '@arkecosystem/core-kernel': 1 }";
        await expect(action.execute({ content: content })).rejects.toThrow("Plugin is not an object");
    });
});
