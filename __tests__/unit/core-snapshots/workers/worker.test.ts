import "jest-extended";

// @ts-ignore
import { workerData } from "worker_threads";

import { init, dispose } from "@packages/core-snapshots/src/workers/worker";
import { DumpWorkerAction } from "@packages/core-snapshots/src/workers/actions/dump-worker-action";

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
                genesisBlockId: "123",
                updateStep: 1000,
                network: "testnet",
            },
        },
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Worker", () => {
    it("should run worker", async () => {
        DumpWorkerAction.prototype.start = jest.fn();

        await init();
        await dispose();
    });
});
