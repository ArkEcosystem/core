import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/log-log";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    exists: jest.fn().mockReturnValue(true),
};

jest.mock("execa", () => {
    return {
        sync: jest.fn().mockImplementation((command: string) => {
            if (command.includes("wc")) {
                return {
                    stdout: "     100 path/to/file",
                };
            }

            return {
                stdout: "file lines",
            };
        }),
    };
});

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

describe("Log:Log", () => {
    it("should have name", () => {
        expect(action.name).toEqual("log.log");
    });

    it("should return totalLines and lines", async () => {
        const result = await action.execute({ name: "ark-core" });

        await expect(result.totalLines).toBe(100);
        await expect(result.lines).toBeString();
    });

    it("should return totalLines and lines if showError is set", async () => {
        const result = await action.execute({ name: "ark-core", showError: true });

        await expect(result.totalLines).toBe(100);
        await expect(result.lines).toBeString();
    });

    it("should throw error if file not exists", async () => {
        mockFilesystem.exists = jest.fn().mockReturnValue(false);

        await expect(action.execute({ name: "ark-core" })).rejects.toThrowError("Cannot find log file");
    });
});
