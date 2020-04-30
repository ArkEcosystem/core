import "jest-extended";

import { Worker } from "worker_threads";
import { WorkerWrapper } from "@packages/core-snapshots/src/workers/worker-wrapper";
import { EventEmitter } from "events";

let mockWorker: any;

jest.mock('worker_threads');

beforeEach(() => {
    mockWorker = new EventEmitter();
    mockWorker.new = jest.fn();
    mockWorker.terminate = jest.fn();
    mockWorker.postMessage = jest.fn();

    // @ts-ignore
    Worker.mockImplementation(() => {
        return mockWorker
    })
})

afterEach(() => {
    jest.clearAllMocks();
})

describe("WorkerWrapper", () => {
    describe("Terminate", () => {
        it("should call terminate", async () => {
            let workerWrapper = new WorkerWrapper({})

            await workerWrapper.terminate();

            expect(mockWorker.terminate).toHaveBeenCalled();
        });
    });

    describe("Start", () => {
        it("should resolve on [started] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.start();

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "started",
                        data: {}
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).toResolve();
        });

        it("should resolve on [exit] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.start();

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("exit", 0)
                    resolve();
                }, 10)
            })

            await expect(promise).toResolve();
        });

        it("should reject on [exception] message event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.start();

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "exception",
                        data: {}
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });

        it("should reject on [any] message event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.start();

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "any",
                        data: {}
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });

        it("should reject on [error] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.start();

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("error", {})
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });
    });

    describe("Sync", () => {
        it("should resolve on [synced] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.sync({});

            let data = {
                dummy: "dummy_data"
            }

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "synchronized",
                        data: data
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).resolves.toEqual(data);
        });

        it("should resolve with undefined on [exit] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.sync({});

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("exit", 0)
                    resolve();
                }, 10)
            })

            await expect(promise).resolves.toBeUndefined();
        });

        it("should reject on [exception] message event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.sync({});

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "exception",
                        data: {}
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });

        it("should reject on [any] message event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.sync({});

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("message", {
                        action: "any",
                        data: {}
                    })
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });

        it("should reject on [error] event", async () => {
            let workerWrapper = new WorkerWrapper({})

            let promise = workerWrapper.sync({});

            await new Promise((resolve) => {
                setTimeout(() => {
                    mockWorker.emit("error", {})
                    resolve();
                }, 10)
            })

            await expect(promise).toReject();
        });
    });
});
