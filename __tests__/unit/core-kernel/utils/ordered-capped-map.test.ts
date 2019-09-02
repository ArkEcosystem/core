import "jest-extended";

import { OrderedCappedMap } from "@packages/core-kernel/src/utils/ordered-capped-map";

describe("Ordered Capped Map", () => {
    it("should set and get an entry", () => {
        const store = new OrderedCappedMap<string, number>(100);
        store.set("foo", 1);
        store.set("bar", 2);

        expect(store.get("foo")).toBe(1);
        expect(store.count()).toBe(2);
    });

    it("should get an entry", () => {
        const store = new OrderedCappedMap<string, number>(2);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.get("1")).toBe(1);
        expect(store.get("3")).toBeUndefined();

        store.set("3", 3);

        expect(store.has("1")).toBeFalse();
        expect(store.has("2")).toBeTrue();
        expect(store.has("3")).toBeTrue();
    });

    it("should set entries and remove ones that exceed the maximum size", () => {
        const store = new OrderedCappedMap<string, number>(2);
        store.set("foo", 1);
        store.set("bar", 2);

        expect(store.get("foo")).toBe(1);
        expect(store.get("bar")).toBe(2);

        store.set("baz", 3);
        store.set("faz", 4);

        expect(store.has("foo")).toBeFalse();
        expect(store.has("bar")).toBeFalse();
        expect(store.has("baz")).toBeTrue();
        expect(store.has("faz")).toBeTrue();
        expect(store.count()).toBe(2);
    });

    it("should update an entry", () => {
        const store = new OrderedCappedMap<string, number>(100);
        store.set("foo", 1);

        expect(store.get("foo")).toBe(1);

        store.set("foo", 2);

        expect(store.get("foo")).toBe(2);
        expect(store.count()).toBe(1);
    });

    it("should return if an entry exists", () => {
        const store = new OrderedCappedMap<string, number>(100);
        store.set("1", 1);

        expect(store.has("1")).toBeTrue();
    });

    it("should remove the specified entrys", () => {
        const store = new OrderedCappedMap<string, number>(100);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.delete("1")).toBeTrue();
        expect(store.has("1")).toBeFalse();
        expect(store.has("2")).toBeTrue();
        expect(store.delete("1")).toBeFalse();
        expect(store.count()).toBe(1);
    });

    it("should remove the specified entrys", () => {
        const store = new OrderedCappedMap<string, number>(2);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.count()).toBe(2);
        expect(store.delete("1")).toBeTrue();
        expect(store.has("1")).toBeFalse();
        expect(store.has("2")).toBeTrue();

        store.delete("2");

        expect(store.count()).toBe(0);
    });

    it("should remove all entrys", () => {
        const store = new OrderedCappedMap<string, number>(3);
        store.set("1", 1);
        store.set("2", 2);
        store.set("3", 3);

        expect(store.count()).toBe(3);

        store.clear();

        expect(store.count()).toBe(0);
    });

    it("should return the first value", () => {
        const store = new OrderedCappedMap<string, number>(2);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.first()).toBe(1);
    });

    it("should return the last value", () => {
        const store = new OrderedCappedMap<string, number>(2);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.last()).toBe(2);
    });

    it("should return the keys", () => {
        const store = new OrderedCappedMap<string, number>(3);
        store.set("1", 1);
        store.set("2", 2);
        store.set("3", 3);

        expect(store.keys()).toEqual(["1", "2", "3"]);
    });

    it("should return the values", () => {
        const store = new OrderedCappedMap<string, number>(3);
        store.set("1", 1);
        store.set("2", 2);
        store.set("3", 3);

        expect(store.values()).toEqual([1, 2, 3]);
    });

    it("should return the entry count", () => {
        const store = new OrderedCappedMap<string, number>(100);
        store.set("1", 1);
        store.set("2", 2);

        expect(store.count()).toBe(2);

        store.delete("1");

        expect(store.count()).toBe(1);

        store.set("3", 3);

        expect(store.count()).toBe(2);
    });

    it("should resize the map", () => {
        const store = new OrderedCappedMap<string, number>(3);
        store.set("1", 1);
        store.set("2", 2);
        store.set("3", 3);

        expect(store.count()).toBe(3);

        store.resize(4);
        store.set("1", 1);
        store.set("2", 2);
        store.set("3", 3);
        store.set("4", 4);
        store.set("5", 5);

        expect(store.count()).toBe(4);
        expect(store.has("1")).toBeFalse();
        expect(store.has("2")).toBeTrue();
        expect(store.has("3")).toBeTrue();
        expect(store.has("4")).toBeTrue();
        expect(store.has("5")).toBeTrue();

        expect(store.count()).toBe(4);

        store.resize(2);

        expect(store.count()).toBe(2);
        expect(store.has("1")).toBeFalse();
        expect(store.has("2")).toBeFalse();
        expect(store.has("3")).toBeFalse();
        expect(store.has("4")).toBeTrue();
        expect(store.has("5")).toBeTrue();
    });
});
