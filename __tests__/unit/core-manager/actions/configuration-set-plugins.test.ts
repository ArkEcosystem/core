import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/configuration-set-plugins";
import { Sandbox } from "@packages/core-test-framework";

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

describe("Configuration:SetPlugins", () => {
    it("should have name", () => {
        expect(action.name).toEqual("configuration.setPlugins");
    });

    it("should validate and save configuration", async () => {
        const content = '{ "core": { "plugins": [ { "package": "@arkecosystem/core-manager" } ] } }';

        const result = await action.execute({ content: content });

        expect(result).toEqual({});
        expect(mockFilesystem.put).toHaveBeenCalledTimes(1);
    });

    it("should throw error - content cannot be resolved", async () => {
        const content = "invalid_json";
        await expect(action.execute({ content: content })).rejects.toThrow("Content cannot be resolved");
    });

    it("should throw error - plugins keys are missing", async () => {
        const content = '{ "core": { } }';
        await expect(action.execute({ content: content })).rejects.toThrow("core plugins array is missing");
    });

    it("should throw error - plugin is not an abject", async () => {
        const content = '{ "core": { "plugins": [ { "package": 123 } ] } }';
        await expect(action.execute({ content: content })).rejects.toThrow("Package is not a string");
    });
});
