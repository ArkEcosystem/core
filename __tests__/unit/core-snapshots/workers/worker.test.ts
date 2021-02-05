import "jest-extended";

import { DumpWorkerAction } from "@packages/core-snapshots/src/workers/actions/dump-worker-action";
import { dispose, init } from "@packages/core-snapshots/src/workers/worker";

jest.mock("worker_threads", () => {
    return {
        workerData: {
            actionOptions: {
                action: "dump",
                table: "blocks",
                start: 1,
                end: 100,
                codec: "default",
                skipCompression: false,
                filePath: "",
                updateStep: 1000,
            },
            networkConfig: require("@packages/crypto").Managers.configManager.all(),
        },
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Worker", () => {
    it("should run worker", async () => {
        DumpWorkerAction.prototype.start = jest.fn();

        await expect(init()).toResolve();
        await expect(dispose()).toResolve();
    });
});
