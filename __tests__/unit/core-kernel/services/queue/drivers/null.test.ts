import { NullQueue } from "../../../../../../packages/core-kernel/src/services/queue/drivers/null";
import { QueueJob } from "../../../../../../packages/core-kernel/src/contracts/kernel/queue";

class MyQueueJob implements QueueJob {
    handle(): void {}
}

describe("NullQueue.make", () => {
    it("should return instance itself", async () => {
        const driver = new NullQueue();
        const result = await driver.make();
        expect(result).toBe(driver);
    });
});

describe("NullQueue.start", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.start();
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.stop", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.stop();
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.pause", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.pause();
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.resume", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.resume();
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.clear", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.clear();
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.push", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.push(new MyQueueJob());
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.later", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.later(10, new MyQueueJob());
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.bulk", () => {
    it("should return undefined", async () => {
        const driver = new NullQueue();
        const result = await driver.bulk([new MyQueueJob(), new MyQueueJob()]);
        expect(result).toBe(undefined);
    });
});

describe("NullQueue.size", () => {
    it("should return 0", async () => {
        const driver = new NullQueue();
        const result = await driver.size();
        expect(result).toBe(0);
    });
});
