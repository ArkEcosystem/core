import "jest-extended";

import { sleep } from "@arkecosystem/utils";

import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";

const dummyFunction = async () => {};

let driver: MemoryQueue;
beforeEach(() => (driver = new MemoryQueue()));

describe("MemoryQueue", () => {
    it("should start the default queue and process jobs", async () => {
        let fnValue: number = 0;

        expect(driver.size()).toBe(0);
        expect(fnValue).toBe(0);

        await driver.push(async () => fnValue++);

        await driver.start();

        expect(fnValue).toBe(1);
    });

    it("should start the given queue and process jobs", async () => {
        let fnValue: number = 0;

        expect(driver.size("balance")).toBe(0);
        expect(fnValue).toBe(0);

        await driver.pushOn("balance", async () => fnValue++);

        await driver.start("balance");

        expect(fnValue).toBe(1);
    });

    it("should stop the default queue and not process new jobs", async () => {
        let fnValue: number = 0;

        expect(driver.size()).toBe(0);
        expect(fnValue).toBe(0);

        await driver.push(async () => fnValue++);

        await driver.start();

        await driver.stop();

        await driver.push(async () => fnValue++);

        expect(fnValue).toBe(1);
    });

    it("should stop the given queue and not process new jobs", async () => {
        let fnValue: number = 0;
        const fnIncrement = async () => fnValue++;

        expect(driver.size("balance")).toBe(0);
        expect(fnValue).toBe(0);

        await driver.pushOn("balance", async () => fnValue++);

        await driver.start("balance");

        await driver.stop("balance");

        await driver.bulkOn("balance", [fnIncrement, fnIncrement]);

        expect(fnValue).toBe(1);
    });

    it("should pause and resume the default queue", async () => {
        let fnValue: number = 0;
        const fnIncrement = async () => fnValue++;

        expect(driver.size()).toBe(0);
        expect(fnValue).toBe(0);

        await driver.push(fnIncrement);

        await driver.start();

        expect(fnValue).toBe(1);

        await driver.pause();

        await driver.bulk([fnIncrement, fnIncrement]);

        await driver.start();

        expect(fnValue).toBe(3);
    });

    it("should pause and resume the given queue", async () => {
        let fnValue: number = 0;
        const fnIncrement = async () => fnValue++;

        expect(driver.size("balance")).toBe(0);
        expect(fnValue).toBe(0);

        await driver.pushOn("balance", fnIncrement);

        await driver.start("balance");

        expect(fnValue).toBe(1);

        await driver.pause("balance");

        await driver.bulkOn("balance", [fnIncrement, fnIncrement]);

        await driver.start("balance");

        expect(fnValue).toBe(3);
    });

    it("should clear the default queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.push(dummyFunction);

        expect(driver.size()).toBe(1);

        await driver.clear();

        expect(driver.size()).toBe(0);
    });

    it("should clear the given queue", async () => {
        expect(driver.size("balance")).toBe(0);

        await driver.pushOn("balance", dummyFunction);

        expect(driver.size("balance")).toBe(1);

        await driver.clear("balance");

        expect(driver.size("balance")).toBe(0);
    });

    it("should push the job onto the default queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.push(dummyFunction);

        expect(driver.size()).toBe(1);
    });

    it("should push the job onto the given queue", () => {
        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(0);

        driver.pushOn("balance", dummyFunction);

        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(1);
    });

    it("should push the job onto the default queue with a 2 second delay", async () => {
        expect(driver.size()).toBe(0);

        await driver.later(2000, dummyFunction);

        await sleep(2000);

        expect(driver.size()).toBe(1);
    });

    it("should push the job onto the default queue with a 2 second delay", async () => {
        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(0);

        await driver.laterOn("balance", 2000, dummyFunction);

        await sleep(2000);

        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(1);
    });

    it("should push the job onto the default queue", async () => {
        expect(driver.size()).toBe(0);

        await driver.bulk([dummyFunction, dummyFunction]);

        expect(driver.size()).toBe(2);
    });

    it("should push the job onto the given queue", async () => {
        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(0);

        await driver.bulkOn("balance", [dummyFunction, dummyFunction]);

        expect(driver.size()).toBe(0);
        expect(driver.size("balance")).toBe(2);
    });

    it("should return the name of the default queue", () => {
        expect(driver.getDefaultQueue()).toBe("default");
    });

    it("should set the name of the default queue", () => {
        expect(driver.getDefaultQueue()).toBe("default");

        driver.setDefaultQueue("new-default");

        expect(driver.getDefaultQueue()).toBe("new-default");
    });
});
