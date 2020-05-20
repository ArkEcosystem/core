import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/configuration-env-get";
import { Sandbox } from "@packages/core-test-framework";

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
        expect(action.name).toEqual("configuration.getEnv");
    });

    it("should return .env content", async () => {
        sandbox.app.environmentFile = jest.fn().mockReturnValue("path/to/env/file");

        const result = await action.execute({});

        await expect(result).toBe("file_content");
    });
});
