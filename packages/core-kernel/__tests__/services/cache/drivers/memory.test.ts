import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { NotImplemented } from "@packages/core-kernel/src/exceptions/runtime";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { MemoryCacheStore } from "@packages/core-kernel/src/services/cache/drivers/memory";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

const items: Record<string, number> = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
};

const itemsBool: boolean[] = new Array(5).fill(true);
const itemsTruthy: boolean[] = new Array(5).fill(true);
const itemsFalsey: boolean[] = new Array(5).fill(false);

let app: Application;
let store: MemoryCacheStore<string, number>;
beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService).to(MemoryEventDispatcher).inSingletonScope();

    store = app.resolve(MemoryCacheStore);
});

describe("MemoryCacheStore", () => {
    it("should make a new instance", async () => {
        await expect(store.make()).resolves.toBeInstanceOf(MemoryCacheStore);
    });

    it("should get all of the items in the store", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.all()).resolves.toEqual(Object.entries(items));
    });

    it("should get the keys of the store items", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.keys()).resolves.toEqual(Object.keys(items));
    });

    it("should get the values of the store items", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.values()).resolves.toEqual(Object.values(items));
    });

    it("should get an item from the store", async () => {
        await store.put("1", 1);

        await expect(store.get("1")).resolves.toBe(1);
    });

    it("should return undefined when getting missing item from the store", async () => {
        await expect(store.get("1")).resolves.toBe(undefined);
    });

    it("should get many items from the store", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.getMany(Object.keys(items))).resolves.toEqual(Object.values(items));
    });

    it("should put an item into the store", async () => {
        await expect(store.put("1", 1)).resolves.toBeTrue();
    });

    it("should put many items into the store", async () => {
        await expect(store.putMany(Object.entries(items))).resolves.toEqual(itemsBool);
    });

    it("should check if the given key exists in the store", async () => {
        await expect(store.has("1")).resolves.toBeFalse();

        await store.put("1", 1);

        await expect(store.has("1")).resolves.toBeTrue();
    });

    it("should check if the given keys exists in the store", async () => {
        await expect(store.hasMany(Object.keys(items))).resolves.toEqual(itemsFalsey);

        await store.putMany(Object.entries(items));

        await expect(store.hasMany(Object.keys(items))).resolves.toEqual(itemsTruthy);
    });

    it("should check if the given key is missing from the store", async () => {
        await expect(store.missing("1")).resolves.toBeTrue();

        await store.put("1", 1);

        await expect(store.missing("1")).resolves.toBeFalse();
    });

    it("should check if the given keys is missing from the store", async () => {
        await expect(store.missingMany(Object.keys(items))).resolves.toEqual(itemsTruthy);

        await store.putMany(Object.entries(items));

        await expect(store.missingMany(Object.keys(items))).resolves.toEqual(itemsFalsey);
    });

    it("should throw if the [forever] method is not implemented", async () => {
        await expect(store.forever("1", 1)).rejects.toThrowError(new NotImplemented(store.constructor.name, "forever"));
    });

    it("should throw if the [foreverMany] method is not implemented", async () => {
        await expect(store.foreverMany(Object.entries(items))).rejects.toThrowError(
            new NotImplemented(store.constructor.name, "foreverMany"),
        );
    });

    it("should remove an item from the store", async () => {
        await store.put("1", 1);

        await expect(store.forget("1")).resolves.toBeTrue();
    });

    it("should remove many items from the store", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.forgetMany(Object.keys(items))).resolves.toEqual(itemsBool);
    });

    it("should remove all items from the store", async () => {
        await store.putMany(Object.entries(items));

        await expect(store.flush()).resolves.toBeTrue();
    });

    it("should throw if the [getPrefix] method is not implemented", async () => {
        await expect(store.getPrefix()).rejects.toThrowError(new NotImplemented(store.constructor.name, "getPrefix"));
    });
});
