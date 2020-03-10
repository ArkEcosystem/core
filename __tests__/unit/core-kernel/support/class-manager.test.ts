import { ClassManager } from "../../../../packages/core-kernel/src/support/class-manager";

class MyMemoryDriver {}

class MyManager extends ClassManager {
    protected getDefaultDriver(): string {
        return "memory";
    }

    protected async createMemoryDriver(): Promise<MyMemoryDriver> {
        return new MyMemoryDriver();
    }
}

describe("ClassManager.driver", () => {
    it("should return driver instance", async () => {
        const manager = new MyManager();
        const memoryDriver = await manager.driver("memory");

        expect(memoryDriver).toBeInstanceOf(MyMemoryDriver);
    });

    it("should throw when attempting to create unknown driver instance", async () => {
        const manager = new MyManager();
        const promise = manager.driver("some");

        await expect(promise).rejects.toThrow();
    });
});
