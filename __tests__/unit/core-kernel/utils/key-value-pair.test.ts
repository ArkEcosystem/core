import "jest-extended";
import { KeyValuePair } from "@packages/core-kernel/src/utils/key-value-pair";

let kv: KeyValuePair<string>;
beforeEach(() => (kv = new KeyValuePair<string>()));

describe("KeyValuePair", () => {
    it("should return all items", () => {
        kv.set("key", "value");

        expect(kv.all()).toEqual({ key: "value" });
    });

    it("should return all items as entries", () => {
        kv.set("key", "value");

        expect(kv.entries()).toEqual([["key", "value"]]);
    });

    it("should return all items as keys", () => {
        kv.set("key", "value");

        expect(kv.keys()).toEqual(["key"]);
    });

    it("should return all items as values", () => {
        kv.set("key", "value");

        expect(kv.values()).toEqual(["value"]);
    });

    it("should set, get and unset a value", () => {
        kv.set("key", "value");

        expect(kv.has("key")).toBeTrue();
        expect(kv.get("key")).toBe("value");

        kv.unset("key");

        expect(kv.has("key")).toBeFalse();
    });

    it("should merge the given object", () => {
        kv.set("key", "value");

        expect(kv.has("key")).toBeTrue();
        expect(kv.get("key")).toBe("value");

        kv.merge({ anotherKey: "value" });

        expect(kv.has("anotherKey")).toBeTrue();
        expect(kv.get("anotherKey")).toBe("value");
    });
});
