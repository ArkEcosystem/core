import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/configuration-update-env";
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

    sandbox.app.environmentFile = jest.fn().mockReturnValue("/path/to/file");
});

describe("Configuration:UpdateEnv", () => {
    it("should have name", () => {
        expect(action.name).toEqual("configuration.updateEnv");
    });

    it("should validate and save configuration", async () => {
        const content = "ABC=1\n\nABD=2";

        const result = await action.execute({ content: content });

        expect(result).toEqual({});
    });

    it("should throw validation error - variable is lowercase", async () => {
        const content = "abc=1";
        await expect(action.execute({ content: content })).rejects.toThrow();
    });

    it("should throw validation error - variable contains invalid chars", async () => {
        const content = "ABC.D=1";
        await expect(action.execute({ content: content })).rejects.toThrow();
    });

    it("should throw validation error - invalid characters (space) after expression", async () => {
        const content = "ABC=1 ";
        await expect(action.execute({ content: content })).rejects.toThrow();
    });

    it("should throw validation error - value is not set", async () => {
        const content = "ABC=";
        await expect(action.execute({ content: content })).rejects.toThrow();
    });
});
