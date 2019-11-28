import { sleep } from "@arkecosystem/utils";

import { Contracts } from "@packages/core-kernel/src";
import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";

class DummyClass implements Contracts.Kernel.QueueJob {
    public constructor(private readonly method?) {}

    public handle(): void {
        this.method();
    }
}

let driver: MemoryQueue;
beforeEach(() => (driver = new MemoryQueue()));

describe("MemoryQueue", () => {
    it("should start queue and process jobs", async () => {
        let dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        expect(dummy).toHaveBeenCalled();
    });

    it("should stop queue and not process new jobs", async () => {
        let dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        await driver.stop();

        await driver.push(new DummyClass(dummy));

        expect(dummy).toHaveBeenCalled();
    });

    it("should pause and resume queue", async () => {
        let dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        expect(dummy).toHaveBeenCalled();

        await driver.pause();

        await driver.bulk([new DummyClass(dummy), new DummyClass(dummy)]);

        await driver.resume();

        expect(dummy).toHaveBeenCalledTimes(3);
    });

    it("should clear queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass());

        expect(driver.size()).toBe(1);

        await driver.clear();

        expect(driver.size()).toBe(0);
    });

    it("should push the job onto queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass());

        expect(driver.size()).toBe(1);
    });

    it("should push the job onto queue with a 2 second delay", async () => {
        expect(driver.size()).toBe(0);

        await driver.later(2000, new DummyClass());

        await sleep(2000);

        expect(driver.size()).toBe(1);
    });

    it("should push the job onto queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.bulk([new DummyClass(), new DummyClass()]);

        expect(driver.size()).toBe(2);
    });
});
