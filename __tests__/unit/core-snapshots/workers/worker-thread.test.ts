import "jest-extended";

import { Worker } from "worker_threads";
import { resolve } from "path";
import * as Contracts from "@packages/core-snapshots/src/contracts";

let _workerData: Contracts.Worker.WorkerData = {
    actionOptions: {
        action: "test",
        table: "blocks",
        codec: "default",
        start: 1,
        end: 100,
        skipCompression: false,
        filePath: "",
        genesisBlockId: "123",
        updateStep: 1000,
        verify: true,
        network: "testnet",
    },
};

let eventListener = {
    onExit: (data: any) => {},
    onError: (data: any) => {},
    onMessage: (data: any) => {},
};

const appendListeners = (worker: Worker) => {
    worker.on("exit", (data) => {
        eventListener.onExit(data);
    });

    worker.on("error", (data) => {
        eventListener.onError(data);
    });

    worker.on("message", (data) => {
        eventListener.onMessage(data);
    });
};

const waitForEvent = (worker: Worker, message?: any): Promise<void> => {
    return new Promise<void>((resolve) => {
        let onEvent = (event, data) => {
            worker.removeAllListeners();

            resolve();
        };

        worker.once("message", (data) => {
            onEvent("message", data);
        });
        worker.once("exit", (data) => {
            onEvent("exit", data);
        });
        worker.once("error", (data) => {
            onEvent("error", data);
        });

        if (message) {
            worker.postMessage(message);
        }
    });
};

let spyOnExit;
let spyOnError;
let spyOnMessage;

let workerPath = resolve("packages/core-snapshots/dist/workers/worker.js");

beforeEach(() => {
    spyOnExit = jest.spyOn(eventListener, "onExit");
    spyOnError = jest.spyOn(eventListener, "onError");
    spyOnMessage = jest.spyOn(eventListener, "onMessage");
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Worker", () => {
    it("should exit without error", async () => {
        let worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        await worker.terminate();

        expect(spyOnExit).toHaveBeenCalledTimes(1);
        expect(spyOnError).toHaveBeenCalledTimes(0);
        expect(spyOnMessage).toHaveBeenCalledTimes(0);
    });

    it("should run init and start Action", async () => {
        let worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        let message: Contracts.Worker.WorkerMessage = {
            action: "start",
            data: {},
        };

        worker.postMessage(message);

        await waitForEvent(worker);

        expect(spyOnExit).toHaveBeenCalledTimes(1);
        expect(spyOnError).toHaveBeenCalledTimes(0);
        expect(spyOnMessage).toHaveBeenCalledTimes(0);
    });

    it("should catch unhandled rejection and pass it in message", async () => {
        let tmpWorkerData = { ..._workerData };
        tmpWorkerData.actionOptions.table = "throwError";

        let worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        let message: Contracts.Worker.WorkerMessage = {
            action: "start",
            data: {},
        };

        await waitForEvent(worker, message);

        expect(spyOnExit).toHaveBeenCalledTimes(0);
        expect(spyOnError).toHaveBeenCalledTimes(0);

        expect(spyOnMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "exception",
            }),
        );
    });

    it("should throw exception", async () => {
        let tmpWorkerData = { ..._workerData };
        tmpWorkerData.actionOptions.table = "wait";

        let worker = new Worker(workerPath, { workerData: _workerData });

        let message: Contracts.Worker.WorkerMessage = {
            action: "start",
            data: {},
        };

        await new Promise((resolve) => {
            worker.postMessage(message);

            worker.once("message", (data) => {
                resolve();
            });
        });

        appendListeners(worker);

        let message2 = {
            action: "sync",
            data: {
                execute: "throwError",
            },
        };

        await waitForEvent(worker, message2);

        expect(spyOnExit).toHaveBeenCalledTimes(0);
        expect(spyOnError).toHaveBeenCalledTimes(0);

        expect(spyOnMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "exception",
            }),
        );
    });
});
