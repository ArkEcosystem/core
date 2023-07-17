import "jest-extended";

import { TestWorkerAction } from "@packages/core-snapshots/src/workers/actions";

const testWorkerAction = new TestWorkerAction();

jest.mock("worker_threads", () => {
    const { EventEmitter } = require("events");
    class ParentPort extends EventEmitter {
        public constructor() {
            super();
        }

        public postMessage(data) {
            this.emit("message", data);
        }
    }

    return {
        parentPort: new ParentPort(),
    };
});

describe("TestWorkerAction", () => {
    it("should start with no action", async () => {
        testWorkerAction.init({
            table: "no_action",
        });

        await expect(testWorkerAction.start()).toResolve();
    });

    it("start should throw error", async () => {
        testWorkerAction.init({
            table: "throwError",
        });

        await expect(testWorkerAction.start()).rejects.toThrow();
    });

    it("start should wait for sync", async () => {
        testWorkerAction.init({
            table: "wait",
        });

        const promise = testWorkerAction.start();

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 10);
        });

        testWorkerAction.sync({});

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 10);
        });
        testWorkerAction.sync({});

        await expect(promise).toResolve();
    });

    it("sync should run with no action", async () => {
        testWorkerAction.sync({});
    });

    it("sync should throw error", async () => {
        expect(() => {
            testWorkerAction.sync({ execute: "throwError" });
        }).toThrow();
    });
});
