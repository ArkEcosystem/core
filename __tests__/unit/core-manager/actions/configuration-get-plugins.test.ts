import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/configuration-get-plugins";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    get: jest.fn().mockResolvedValue("file_content"),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

describe("Configuration:EnvGet", () => {
    it("should have name", () => {
        expect(action.name).toEqual("configuration.getPlugins");
    });

    it("should return plugins.js content", async () => {
        sandbox.app.configPath = jest.fn().mockReturnValue("path/to/env/file");

        const result = await action.execute({});

        await expect(result).toBe("file_content");
    });
});
