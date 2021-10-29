import "jest-extended";

import { WorkerWrapper } from "@packages/core-snapshots/src/workers/worker-wrapper";
import { EventEmitter } from "events";
import { Worker } from "worker_threads";

let mockWorker: any;

jest.mock("worker_threads");

beforeEach(() => {
    mockWorker = new EventEmitter();
    mockWorker.new = jest.fn();
    mockWorker.terminate = jest.fn();
    mockWorker.postMessage = jest.fn();

    // @ts-ignore
    Worker.mockImplementation(() => {
        return mockWorker;
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("WorkerWrapper", () => {
    describe("Terminate", () => {
        it("should call terminate", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            await workerWrapper.terminate();

            expect(mockWorker.terminate).toHaveBeenCalled();
        });
    });

    describe("Start", () => {
        it("should resolve on [started] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.start();

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "started",
                        data: {},
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).toResolve();
        });

        it("should resolve on [exit] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.start();

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("exit", 0);
                    resolve();
                }, 10);
            });

            await expect(promise).toResolve();
        });

        it("should reject on [exception] message event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.start();

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "exception",
                        data: {},
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });

        it("should reject on [any] message event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.start();

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "any",
                        data: {},
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });

        it("should reject on [error] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.start();

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("error", {});
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });
    });

    describe("Sync", () => {
        it("should resolve on [synced] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.sync({});

            const data = {
                dummy: "dummy_data",
            };

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "synchronized",
                        data: data,
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).resolves.toEqual(data);
        });

        it("should resolve with undefined on [exit] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.sync({});

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("exit", 0);
                    resolve();
                }, 10);
            });

            await expect(promise).resolves.toBeUndefined();
        });

        it("should resolve if worker already exit", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            // @ts-ignore
            workerWrapper.isDone = true;

            const promise = workerWrapper.sync({});

            await expect(promise).resolves.toBeUndefined();
        });

        it("should reject on [exception] message event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.sync({});

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "exception",
                        data: {},
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });

        it("should reject on [any] message event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.sync({});

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "any",
                        data: {},
                    });
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });

        it("should reject on [error] event", async () => {
            const workerWrapper = new WorkerWrapper({} as any);

            const promise = workerWrapper.sync({});

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("error", {});
                    resolve();
                }, 10);
            });

            await expect(promise).toReject();
        });
    });
});
