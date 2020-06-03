import "jest-extended";

import { sleep } from "@arkecosystem/utils";
import { Container, Contracts, Enums } from "@packages/core-kernel/src";
import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";
import { Sandbox } from "@packages/core-test-framework";

class DummyClass implements Contracts.Kernel.QueueJob {
    public constructor(private readonly method?) {}

    public handle(): void {
        this.method();
    }
}

let sanbox: Sandbox;
let driver: MemoryQueue;

const mockEventDispatcher = {
    dispatch: jest.fn(),
};

beforeEach(() => {
    sanbox = new Sandbox();

    sanbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    driver = sanbox.app.resolve<MemoryQueue>(MemoryQueue);
});

afterEach(() => {
    jest.clearAllMocks();
});

const expectEventData = () => {
    return expect.objectContaining({
        driver: "memory",
        executionTime: expect.toBeNumber(),
    });
};

const expectEventErrorData = () => {
    return expect.objectContaining({
        driver: "memory",
        executionTime: expect.toBeNumber(),
        error: expect.toBeObject(),
    });
};

const delay = async (timeout) => {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
};

describe("MemoryQueue", () => {
    it("should start queue and process jobs", async () => {
        const dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        expect(dummy).toHaveBeenCalled();

        expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Finished, expectEventData());
    });

    it("should stop queue and not process new jobs", async () => {
        const dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        await driver.stop();

        await driver.push(new DummyClass(dummy));

        expect(dummy).toHaveBeenCalled();

        expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Finished, expectEventData());
    });

    it("should pause and resume queue", async () => {
        const dummy: jest.Mock = jest.fn();

        expect(driver.size()).toBe(0);

        await driver.push(new DummyClass(dummy));

        await driver.start();

        await delay(100);

        expect(dummy).toHaveBeenCalled();

        await driver.pause();

        await driver.bulk([new DummyClass(dummy), new DummyClass(dummy)]);

        await driver.resume();

        await delay(100);

        expect(dummy).toHaveBeenCalledTimes(3);

        expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(3);
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Finished, expectEventData());
    });

    it("should dipatch error if error in queue", async () => {
        const dummy: jest.Mock = jest.fn().mockImplementation(() => {
            throw new Error();
        });

        await driver.push(new DummyClass(dummy));

        driver.start();

        // @ts-ignore
        await expect(driver.lastQueue).rejects.toThrowError();

        expect(dummy).toHaveBeenCalled();
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
        expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(Enums.QueueEvent.Failed, expectEventErrorData());
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
