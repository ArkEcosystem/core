import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/snapshots-restore";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const mockSnapshotManager = {
    restore: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.SnapshotsManager).toConstantValue(mockSnapshotManager);

    sandbox.app.network = jest.fn().mockReturnValue("testnet");

    action = sandbox.app.resolve(Action);
});

describe("Snapshots:Restore", () => {
    it("should have name", () => {
        expect(action.name).toEqual("snapshots.restore");
    });

    it("should return empty object if ok", async () => {
        const result = await action.execute({});

        expect(result).toEqual({});
    });

    it("should return error if manager throws error", async () => {
        mockSnapshotManager.restore.mockImplementation(async () => {
            throw new Error();
        });

        await expect(action.execute({})).rejects.toThrow();
    });
});
