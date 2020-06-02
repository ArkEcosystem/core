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
    restore: () => {
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
    describe("Dump", () => {
        it("should resolve if no actions is running", async () => {
            await expect(snapshotsManager.dump({} as any)).toResolve();

            // Delay
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 800);
            });

            await expect(snapshotsManager.dump({} as any)).toResolve();
        });

        it("should throw if another action is running", async () => {
            await expect(snapshotsManager.dump({} as any)).toResolve();
            await expect(snapshotsManager.dump({} as any)).rejects.toThrow();
        });
    });

    describe("Restore", () => {
        it("should resolve if no actions is running", async () => {
            await expect(snapshotsManager.restore({} as any)).toResolve();

            // Delay
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 800);
            });

            await expect(snapshotsManager.restore({} as any)).toResolve();
        });

        it("should throw if another action is running", async () => {
            await expect(snapshotsManager.restore({} as any)).toResolve();
            await expect(snapshotsManager.restore({} as any)).rejects.toThrow();
        });
    });
});
