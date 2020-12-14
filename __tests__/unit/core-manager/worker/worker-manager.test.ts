import "jest-extended";

import { WorkerManager } from "@packages/core-manager/src/workers/worker-manager";
import { EventEmitter } from "events";
import { Worker } from "worker_threads";

jest.mock("worker_threads");

let mockWorker;
let workerManager: WorkerManager;

beforeEach(() => {
    workerManager = new WorkerManager();

    mockWorker = new EventEmitter();
    mockWorker.new = jest.fn();

    // @ts-ignore
    Worker.mockImplementation(() => {
        return mockWorker;
    });
});

describe("WorkerManager", () => {
    describe("canRun", () => {
        it("should return true if worker is not running", async () => {
            expect(workerManager.canRun()).toBeTruthy();
        });

        it("should return false if worker is running", async () => {
            // @ts-ignore
            workerManager.runningWorkers++;

            expect(workerManager.canRun()).toBeFalsy();
        });
    });

    describe("generateLog", () => {
        it("should resolve if worker exit without error", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {}, "test.log.gz");

            mockWorker.emit("exit");

            await expect(promise).toResolve();
        });

        it("should reject if worker throws error", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {}, "test.log.gz");

            mockWorker.emit("error", new Error("Test error"));

            await expect(promise).rejects.toThrowError("Test error");
        });

        it("should reject only once", async () => {
            const promise = workerManager.generateLog("/path/to/db", { tables: [] }, {}, "test.log.gz");

            mockWorker.emit("error", new Error("Test error"));
            mockWorker.emit("error", new Error("Test error"));
            mockWorker.emit("exit");

            await expect(promise).rejects.toThrowError("Test error");
        });
    });
});
