import "jest-extended";

import { AttributeIndex } from "@packages/core-kernel/src/services/attributes/attribute-index";

class UseByReference {}

let store: AttributeIndex;

beforeEach(() => (store = new AttributeIndex()));

describe("AttributeIndex", () => {
    it("should bind and unbind an attribute", () => {
        expect(store.bind("someAttribute")).toBeTrue();

        expect(store.bind("someAttribute")).toBeFalse();

        expect(store.unbind("anotherAttribute")).toBeFalse();
    });

    it("should throw if an unknown attribute is tried to be accessed", () => {
        expect(() => store.get("1", "someAttribute")).toThrow("Tried to access an unknown attribute: someAttribute");
    });

    it("should determine if an attribute is bound", () => {
        store.bind("someAttribute");

        expect(store.isBound("someAttribute")).toBeTrue();

        expect(store.unbind("someAttribute")).toBeTrue();

        expect(store.isBound("someAttribute")).toBeFalse();
    });

    describe.each([["number", 1], ["string", "stringKey"], ["reference", new UseByReference()]])(
        "works with numbers, strings and references as keys",
        (idType, id) => {
            describe(`using a ${idType} as key`, () => {
                it("should get the given attribute", () => {
                    store.bind("someAttribute");

                    store.set(id, "someAttribute", "value");

                    expect(store.get(id, "someAttribute")).toBe("value");
                });

                it("should set nested attributes", () => {
                    store.bind("collection");
                    store.bind("collection.key1");
                    store.bind("collection.key2");
                    store.bind("collection.key3");

                    store.set(id, "collection", {});
                    store.set(id, "collection.key1", "value1");
                    store.set(id, "collection.key2", "value2");
                    store.set(id, "collection.key3", "value3");

                    expect(store.get(id, "collection")).toEqual({
                        key1: "value1",
                        key2: "value2",
                        key3: "value3",
                    });
                    expect(store.get(id, "collection.key1")).toBe("value1");
                    expect(store.get(id, "collection.key2")).toBe("value2");
                    expect(store.get(id, "collection.key3")).toBe("value3");
                });

                it("should throw if an attribute is tried to be set on an unknown attribute", () => {
                    expect(() => store.set(id, "someAttribute", "value")).toThrow(
                        "Tried to access an unknown attribute: someAttribute",
                    );
                });

                it("should throw if an attribute is tried to be forgotten on an unknown attribute", () => {
                    expect(() => store.forget(id, "someAttribute")).toThrow(
                        "Tried to access an unknown attribute: someAttribute",
                    );
                });

                it("should throw if an unknown attribute is tried to be forgotten", () => {
                    store.bind("someAttribute");

                    expect(() => store.forget(id, "anotherAttribute")).toThrow(
                        "Tried to access an unknown attribute: anotherAttribute",
                    );
                });

                it("should forget the given attribute", () => {
                    store.bind("someAttribute");

                    store.set(id, "someAttribute", "value");

                    expect(store.has(id, "someAttribute")).toBeTrue();

                    store.forget(id, "someAttribute");

                    expect(store.has(id, "someAttribute")).toBeFalse();
                });

                it("should throw if an attribute is tried to be checked on an unknown attribute", () => {
                    expect(() => store.has(id, "someAttribute")).toThrow(
                        "Tried to access an unknown attribute: someAttribute",
                    );
                });
            });
        },
    );
});
