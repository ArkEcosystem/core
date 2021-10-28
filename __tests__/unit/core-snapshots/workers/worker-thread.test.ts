import "jest-extended";

import * as Contracts from "@packages/core-snapshots/src/contracts";
import { Managers } from "@packages/crypto";
import { resolve } from "path";
import { Worker } from "worker_threads";

const _workerData: Contracts.Worker.WorkerData = {
    actionOptions: {
        action: "test",
        table: "blocks",
        codec: "default",
        start: 1,
        end: 100,
        skipCompression: false,
        filePath: "",
        updateStep: 1000,
        verify: true,
    },
    cryptoPackages: [],
    networkConfig: Managers.configManager.all()!,
};

const eventListener = {
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
        const onEvent = (event, data) => {
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

const workerPath = resolve("packages/core-snapshots/dist/workers/worker.js");

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
        const worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        await worker.terminate();

        expect(spyOnExit).toHaveBeenCalledTimes(1);
        expect(spyOnError).toHaveBeenCalledTimes(0);
        expect(spyOnMessage).toHaveBeenCalledTimes(0);
    });

    it("should run init and start Action", async () => {
        const worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        const message: Contracts.Worker.WorkerMessage = {
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
        const tmpWorkerData = { ..._workerData };
        tmpWorkerData.actionOptions.table = "throwError";

        const worker = new Worker(workerPath, { workerData: _workerData });

        appendListeners(worker);

        const message: Contracts.Worker.WorkerMessage = {
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
        const tmpWorkerData = { ..._workerData };
        tmpWorkerData.actionOptions.table = "wait";

        const worker = new Worker(workerPath, { workerData: _workerData });

        const message: Contracts.Worker.WorkerMessage = {
            action: "start",
            data: {},
        };

        await new Promise<void>((resolve) => {
            worker.postMessage(message);

            worker.once("message", (data) => {
                resolve();
            });
        });

        appendListeners(worker);

        const message2 = {
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
