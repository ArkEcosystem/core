import "jest-extended";

import { sleep } from "@arkecosystem/utils";
import { Container, Contracts, Enums } from "@packages/core-kernel";
import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";
import { Sandbox } from "@packages/core-test-framework";
import { EventEmitter } from "events";
import { performance } from "perf_hooks";

EventEmitter.prototype.constructor = Object.prototype.constructor;

class DummyJob implements Contracts.Kernel.QueueJob {
    public constructor(private readonly method) {}

    public async handle(): Promise<void> {
        return await this.method();
    }
}

let sandbox: Sandbox;
let driver: MemoryQueue;

const eventDispatcher = {
    dispatch: jest.fn(),
};

const logger = {
    warning: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    driver = sandbox.app.resolve<MemoryQueue>(MemoryQueue);
});

afterEach(() => {
    jest.clearAllMocks();
});

const jobMethod = jest.fn();

describe("MemoryQueue", () => {
    describe("Start", () => {
        it("should process job", async () => {
            await driver.push(new DummyJob(jobMethod));
            await sleep(50);

            expect(jobMethod).not.toHaveBeenCalled();

            await driver.start();
            await sleep(50);

            expect(jobMethod).toHaveBeenCalledTimes(1);
        });

        it("should process on push if already started", async () => {
            await driver.start();

            await driver.push(new DummyJob(jobMethod));
            await sleep(50);

            expect(jobMethod).toHaveBeenCalledTimes(1);
        });

        it("should remain started after all jobs are processed", async () => {
            await driver.push(new DummyJob(jobMethod));

            await driver.start();
            await sleep(50);

            expect(jobMethod).toHaveBeenCalledTimes(1);
            expect(driver.isStarted()).toBe(true);
        });

        it("should not interfere with processing if called multiple times", async () => {
            let methodFinish1;
            let methodFinish2;

            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
                methodFinish1 = performance.now();
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
                methodFinish2 = performance.now();
            });

            const onDrain = jest.fn();
            driver.on("drain", onDrain);

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            const start1 = driver.start();
            const start2 = driver.start();

            await expect(start1).toResolve();
            await expect(start2).toResolve();

            await sleep(150);

            expect(methodFinish2).toBeGreaterThan(methodFinish1);
            expect(methodFinish2 - methodFinish1).toBeGreaterThan(40);
            expect(methodFinish2 - methodFinish1).toBeLessThan(60);

            expect(onDrain).toHaveBeenCalledTimes(1);
        });
    });

    describe("Clear", () => {
        it("should clear all jobs when stopped", async () => {
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);

            await driver.clear();

            expect(driver.size()).toBe(0);
        });

        it("should clear all jobs when started and keep current job running", async () => {
            jobMethod.mockImplementation(async () => {
                await sleep(20);
            });

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(2);

            await driver.start();
            await driver.clear();

            expect(driver.size()).toBe(0);
            expect(driver.isRunning()).toBe(true);
            expect(driver.isStarted()).toBe(true);
            expect(jobMethod).toHaveBeenCalledTimes(1); // Fist job runs instantly

            await sleep(50);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(true);
        });
    });

    describe("Stop", () => {
        it("should clear all jobs when stopped", async () => {
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);

            await driver.stop();

            expect(driver.size()).toBe(0);
            expect(driver.isStarted()).toBe(false);
        });

        it("should clear all jobs when started and wait till current is processed", async () => {
            jobMethod.mockImplementation(async () => {
                await sleep(50);
            });

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(2);

            await driver.start();
            await driver.stop();

            expect(driver.size()).toBe(0);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
            expect(jobMethod).toHaveBeenCalledTimes(1); // Fist job is run after start
        });

        it("should resolve multiple stop promises", async () => {
            jobMethod.mockImplementation(async () => {
                await sleep(50);
            });

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(2);

            await driver.start();
            const stop1 = driver.stop();
            const stop2 = driver.stop();

            await driver.stop();

            expect(driver.size()).toBe(0);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
            expect(jobMethod).toHaveBeenCalledTimes(1); // Fist job is run after start

            await expect(stop1).toResolve();
            await expect(stop2).toResolve();
        });

        it("should not process new jobs after stop", async () => {
            await driver.start();
            await driver.stop();

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            await sleep(10);

            expect(driver.size()).toBe(2);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
            expect(jobMethod).not.toHaveBeenCalled();
        });
    });

    describe("Pause", () => {
        it("should pause after current job is processed", async () => {
            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
            });

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            expect(driver.size()).toBe(2);

            await driver.start();

            await driver.pause();

            expect(jobMethod1).toHaveBeenCalled();
            expect(jobMethod2).not.toHaveBeenCalled();

            expect(driver.size()).toBe(1);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
        });

        it("should pause after current job is processed with error", async () => {
            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
                throw new Error();
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
            });

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            expect(driver.size()).toBe(2);

            await driver.start();

            await driver.pause();

            expect(jobMethod1).toHaveBeenCalled();
            expect(jobMethod2).not.toHaveBeenCalled();

            expect(driver.size()).toBe(1);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
            expect(logger.warning).toHaveBeenCalled();
        });

        it("should not process new jobs after pause", async () => {
            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);

            await driver.start();
            await driver.pause();

            expect(driver.size()).toBe(0);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);

            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
        });

        it("should resolve all if called multiple times", async () => {
            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
            });

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            expect(driver.size()).toBe(2);

            await driver.start();

            const pause1 = driver.pause();
            await driver.pause();

            await expect(pause1).toResolve();

            expect(jobMethod1).toHaveBeenCalled();
            expect(jobMethod2).not.toHaveBeenCalled();

            expect(driver.size()).toBe(1);
            expect(driver.isRunning()).toBe(false);
            expect(driver.isStarted()).toBe(false);
        });
    });

    describe("Resume", () => {
        it("should resume processing after pause", async () => {
            await driver.pause();

            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);
            expect(driver.isStarted()).toBe(false);

            await driver.resume();

            await sleep(10);

            expect(driver.size()).toBe(0);
            expect(driver.isStarted()).toBe(true);
        });

        it("should resume processing after stop", async () => {
            await driver.stop();

            await driver.push(new DummyJob(jobMethod));

            expect(driver.size()).toBe(1);
            expect(driver.isStarted()).toBe(false);

            await driver.resume();

            await sleep(10);

            expect(driver.size()).toBe(0);
            expect(driver.isStarted()).toBe(true);
        });

        it("should not interfere with start", async () => {
            let methodFinish1;
            let methodFinish2;

            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
                methodFinish1 = performance.now();
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
                methodFinish2 = performance.now();
            });

            const onDrain = jest.fn();
            driver.on("drain", onDrain);

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            const start1 = driver.start();
            const resume1 = driver.resume();

            await expect(start1).toResolve();
            await expect(resume1).toResolve();

            await sleep(150);

            expect(methodFinish2).toBeGreaterThan(methodFinish1);
            expect(methodFinish2 - methodFinish1).toBeGreaterThan(40);
            expect(methodFinish2 - methodFinish1).toBeLessThan(60);

            expect(onDrain).toHaveBeenCalledTimes(1);
        });

        it("should not interfere with another resume", async () => {
            let methodFinish1;
            let methodFinish2;

            const jobMethod1 = jest.fn(async () => {
                await sleep(50);
                methodFinish1 = performance.now();
            });

            const jobMethod2 = jest.fn(async () => {
                await sleep(50);
                methodFinish2 = performance.now();
            });

            const onDrain = jest.fn();
            driver.on("drain", onDrain);

            await driver.push(new DummyJob(jobMethod1));
            await driver.push(new DummyJob(jobMethod2));

            const resume1 = driver.resume();
            const resume2 = driver.resume();

            await expect(resume1).toResolve();
            await expect(resume2).toResolve();

            await sleep(150);

            expect(methodFinish2).toBeGreaterThan(methodFinish1);
            expect(methodFinish2 - methodFinish1).toBeGreaterThan(40);
            expect(methodFinish2 - methodFinish1).toBeLessThan(60);

            expect(onDrain).toHaveBeenCalledTimes(1);
        });
    });

    describe("Later", () => {
        it("should push job with delay", async () => {
            await driver.later(50, new DummyJob(jobMethod));

            expect(driver.size()).toBe(0);

            await sleep(60);

            expect(driver.size()).toBe(1);
        });
    });

    describe("Bulk", () => {
        it("should push multiple jobs", async () => {
            await driver.bulk([new DummyJob(jobMethod), new DummyJob(jobMethod)]);

            expect(driver.size()).toBe(2);
        });
    });

    describe("EventEmitter", () => {
        it("should emit jobDone", async () => {
            const onJobDone = jest.fn();
            driver.on("jobDone", onJobDone);

            jobMethod.mockResolvedValue("dummy_data");
            const job1 = new DummyJob(jobMethod);
            const job2 = new DummyJob(jobMethod);

            await driver.push(job1);
            await driver.push(job2);
            await driver.start();

            await sleep(10);

            expect(jobMethod).toHaveBeenCalledTimes(2);
            expect(onJobDone).toHaveBeenCalledTimes(2);
            expect(onJobDone).toHaveBeenCalledWith(job1, "dummy_data");
            expect(onJobDone).toHaveBeenCalledWith(job2, "dummy_data");
        });

        it("should emit jobError and continue processing", async () => {
            const onJobDone = jest.fn();
            driver.on("jobDone", onJobDone);

            const onJobError = jest.fn();
            driver.on("jobError", onJobError);

            jobMethod.mockResolvedValue("dummy_data");

            const error = new Error("dummy_error");
            const errorMethod = jest.fn().mockImplementation(async () => {
                throw error;
            });

            const job1 = new DummyJob(errorMethod);
            const job2 = new DummyJob(jobMethod);

            await driver.push(job1);
            await driver.push(job2);
            await driver.start();

            await sleep(10);

            expect(errorMethod).toHaveBeenCalledTimes(1);
            expect(jobMethod).toHaveBeenCalledTimes(1);

            expect(onJobError).toHaveBeenCalledTimes(1);
            expect(onJobError).toHaveBeenCalledWith(job1, error);

            expect(onJobDone).toHaveBeenCalledTimes(1);
            expect(onJobDone).toHaveBeenCalledWith(job2, "dummy_data");
        });

        it("should emit drain", async () => {
            const onDrain = jest.fn();
            driver.on("drain", onDrain);

            await driver.push(new DummyJob(jobMethod));
            await driver.start();

            await sleep(10);

            // Second iteration
            expect(jobMethod).toHaveBeenCalledTimes(1);
            expect(onDrain).toHaveBeenCalledTimes(1);

            await driver.push(new DummyJob(jobMethod));
            await driver.start();

            await sleep(10);

            expect(jobMethod).toHaveBeenCalledTimes(2);
            expect(onDrain).toHaveBeenCalledTimes(2);
        });
    });

    describe("DispatchEvents", () => {
        const error = new Error("dummy_error");

        const expectEventData = () => {
            return expect.objectContaining({
                driver: "memory",
                executionTime: expect.toBeNumber(),
                data: "dummy_data",
            });
        };

        const expectEventErrorData = () => {
            return expect.objectContaining({
                driver: "memory",
                executionTime: expect.toBeNumber(),
                error: expect.toBeOneOf([error]),
            });
        };

        it("should dispatch 'queue.finished' after every processed job", async () => {
            jobMethod.mockResolvedValue("dummy_data");

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            await driver.start();
            await sleep(10);

            expect(jobMethod).toHaveBeenCalledTimes(2);

            expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(2);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Finished, expectEventData());
        });

        it("should dispatch 'queue.failed' after every failed job", async () => {
            jobMethod.mockImplementation(async () => {
                throw error;
            });

            await driver.push(new DummyJob(jobMethod));
            await driver.push(new DummyJob(jobMethod));

            await driver.start();
            await sleep(10);

            expect(jobMethod).toHaveBeenCalledTimes(2);
            expect(logger.warning).toHaveBeenCalledTimes(2);

            expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(2);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Failed, expectEventErrorData());
        });
    });
});
