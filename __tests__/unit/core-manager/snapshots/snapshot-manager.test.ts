import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { SnapshotsManager } from "@packages/core-manager/src/snapshots/snapshots-manager";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let snapshotsManager: SnapshotsManager;

const mockSnapshotService = {
    dump: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    },
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.SnapshotsManager).to(SnapshotsManager);
    sandbox.app.bind(Container.Identifiers.SnapshotService).toConstantValue(mockSnapshotService);

    snapshotsManager = sandbox.app.get(Identifiers.SnapshotsManager);
});

describe("Snapshots:Create", () => {
    it("should resolve if no actions is running", async () => {
        await expect(snapshotsManager.start("dummy_name", {})).toResolve();

        // Delay
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 800);
        });

        await expect(snapshotsManager.start("dummy_name", {})).toResolve();
    });

    it("should throw if another action is running", async () => {
        await expect(snapshotsManager.start("dummy_name", {})).toResolve();
        await expect(snapshotsManager.start("dummy_name", {})).rejects.toThrow();
    });
});
