import { NullCacheStore } from "../../../../../../packages/core-kernel/src/services/cache/drivers/null";

describe("NullCacheStore.make", () => {
    it("should return instance back", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.make();
        expect(result).toBe(driver);
    });
});

describe("NullCacheStore.all", () => {
    it("should return empty array", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.all();
        expect(result).toStrictEqual([]);
    });
});

describe("NullCacheStore.keys", () => {
    it("should return empty array", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.keys();
        expect(result).toStrictEqual([]);
    });
});

describe("NullCacheStore.values", () => {
    it("should return empty array", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.values();
        expect(result).toStrictEqual([]);
    });
});

describe("NullCacheStore.get", () => {
    it("should return undefined", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.get("key");
        expect(result).toBeUndefined();
    });
});

describe("NullCacheStore.getMany", () => {
    it("should return array of undefined", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.getMany(["key1", "key2"]);
        expect(result).toStrictEqual([undefined, undefined]);
    });
});

describe("NullCacheStore.put", () => {
    it("should return false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.put("key", "value");
        expect(result).toBe(false);
    });
});

describe("NullCacheStore.putMany", () => {
    it("should return array of false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.putMany([
            ["key1", "value1"],
            ["key2", "value2"],
        ]);
        expect(result).toStrictEqual([false, false]);
    });
});

describe("NullCacheStore.has", () => {
    it("should return false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.has("key");
        expect(result).toBe(false);
    });
});

describe("NullCacheStore.hasMany", () => {
    it("should return array of false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.hasMany(["key1", "key2"]);
        expect(result).toStrictEqual([false, false]);
    });
});

describe("NullCacheStore.missing", () => {
    it("should return true", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.missing("key");
        expect(result).toBe(true);
    });
});

describe("NullCacheStore.missingMany", () => {
    it("should return array of true", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.missingMany(["key1", "key2"]);
        expect(result).toStrictEqual([true, true]);
    });
});

describe("NullCacheStore.forever", () => {
    it("should return false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.forever("key", "value");
        expect(result).toBe(false);
    });
});

describe("NullCacheStore.foreverMany", () => {
    it("should return array of false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.foreverMany([
            ["key1", "value1"],
            ["key2", "value2"],
        ]);
        expect(result).toStrictEqual([false, false]);
    });
});

describe("NullCacheStore.forget", () => {
    it("should return false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.forget("key");
        expect(result).toBe(false);
    });
});

describe("NullCacheStore.forgetMany", () => {
    it("should return array of false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.forgetMany(["key1", "key2"]);
        expect(result).toStrictEqual([false, false]);
    });
});

describe("NullCacheStore.flush", () => {
    it("should return false", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.flush();
        expect(result).toBe(false);
    });
});

describe("NullCacheStore.getPrefix", () => {
    it("should return empty string", async () => {
        const driver = new NullCacheStore<string, string>();
        const result = await driver.getPrefix();
        expect(result).toBe("");
    });
});
