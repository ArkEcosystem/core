import { ClassManager } from "../../../../packages/core-kernel/src/support/class-manager";

class MyMemoryDriver {}
class MyRemoteDriver {}

class MyManager extends ClassManager {
    protected getDefaultDriver(): string {
        return "memory";
    }

    protected async createMemoryDriver(): Promise<MyMemoryDriver> {
        return new MyMemoryDriver();
    }

    protected async createRemoteDriver(): Promise<MyRemoteDriver> {
        return new MyRemoteDriver();
    }
}

describe("ClassManager.driver", () => {
    it("should return default driver instance", async () => {
        const manager = new MyManager();
        const memoryDriver = await manager.driver();

        expect(memoryDriver).toBeInstanceOf(MyMemoryDriver);
    });

    it("should return new default driver instance after default driver change", async () => {
        const manager = new MyManager();
        manager.setDefaultDriver("remote");
        const remoteDriver = await manager.driver();

        expect(remoteDriver).toBeInstanceOf(MyRemoteDriver);
    });

    it("should return driver instance", async () => {
        const manager = new MyManager();
        const remoteDriver = await manager.driver("remote");

        expect(remoteDriver).toBeInstanceOf(MyRemoteDriver);
    });

    it("should throw when attempting to create unknown driver instance", async () => {
        const manager = new MyManager();
        const promise = manager.driver("some");

        await expect(promise).rejects.toThrow();
    });
});
