import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/snapshots-list";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const mockFilesystem = {
    directories: jest.fn().mockResolvedValue(["/path/to/file/1-5", "/path/to/file/5-10"]),
    size: jest.fn().mockResolvedValue(1024),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue(mockFilesystem);

    action = sandbox.app.resolve(Action);
});

describe("Snapshots:List", () => {
    it("should have name", () => {
        expect(action.name).toEqual("snapshots.list");
    });

    it("should return list of snapshot info", async () => {
        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(2);
        for (const item of result) {
            expect(item.name).toBeString();
            expect(item.size).toBe(4);
        }
    });
});
