import { NullEventDispatcher } from "../../../../../../packages/core-kernel/src/services/events/drivers/null";
import { EventListener, EventName } from "../../../../../../packages/core-kernel/src/contracts/kernel/events";

class MyEventListener implements EventListener {
    public handle(payload: { name: EventName; data: any }): void {}
}

describe("NullEventDispatcher.listen", () => {
    it("should return function", () => {
        const driver = new NullEventDispatcher();
        const result = driver.listen("event", new MyEventListener());
        expect(typeof result).toBe("function");
    });
});

describe("NullEventDispatcher.listenMany", () => {
    it("should return map of functions", () => {
        const driver = new NullEventDispatcher();
        const result = driver.listenMany([
            ["event1", new MyEventListener()],
            ["event2", new MyEventListener()],
        ]);
        expect(Array.from(result.keys())).toStrictEqual(["event1", "event2"]);
        expect(typeof result.get("event1")).toBe("function");
        expect(typeof result.get("event2")).toBe("function");
    });
});

describe("NullEventDispatcher.listenOnce", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.listenOnce("event", new MyEventListener());
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.forget", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.forget("event");
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.forgetMany", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.forgetMany(["event1", "event2"]);
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.flush", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.flush();
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.getListeners", () => {
    it("should return empty array", () => {
        const driver = new NullEventDispatcher();
        const result = driver.getListeners();
        expect(result).toStrictEqual([]);
    });
});

describe("NullEventDispatcher.hasListeners", () => {
    it("should return false", () => {
        const driver = new NullEventDispatcher();
        const result = driver.hasListeners("event");
        expect(result).toBe(false);
    });
});

describe("NullEventDispatcher.countListeners", () => {
    it("should return 0", () => {
        const driver = new NullEventDispatcher();
        const result = driver.countListeners("event");
        expect(result).toBe(0);
    });
});

describe("NullEventDispatcher.dispatch", () => {
    it("should return undefined", async () => {
        const driver = new NullEventDispatcher();
        const result = await driver.dispatch("event", "data");
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.dispatchSeq", () => {
    it("should return undefined", async () => {
        const driver = new NullEventDispatcher();
        const result = await driver.dispatchSeq("event", "data");
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.dispatchSync", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.dispatchSync("event", "data");
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.dispatchMany", () => {
    it("should return undefined", async () => {
        const driver = new NullEventDispatcher();
        const result = await driver.dispatchMany([
            ["event1", "data1"],
            ["event2", "data2"],
        ]);
        expect(result).toBe(undefined);
    });
});

describe("NullEventDispatcher.dispatchManySync", () => {
    it("should return undefined", () => {
        const driver = new NullEventDispatcher();
        const result = driver.dispatchManySync([
            ["event1", "data1"],
            ["event2", "data2"],
        ]);
        expect(result).toBe(undefined);
    });
});
