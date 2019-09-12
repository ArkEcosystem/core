import "jest-extended";

import { AttributeIndex } from "@packages/core-kernel/src/services/attributes/attribute-index";

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

    it("should get the given attribute", () => {
        store.bind("someAttribute");

        store.set("1", "someAttribute", "value");

        expect(store.get("1", "someAttribute")).toBe("value");
    });

    it("should throw if an attribute is tried to be set on an unknown attribute", () => {
        expect(() => store.set("1", "someAttribute", "value")).toThrow(
            "Tried to access an unknown attribute: someAttribute",
        );
    });

    it("should throw if an attribute is tried to be forgotten on an unknown attribute", () => {
        expect(() => store.forget("1", "someAttribute")).toThrow("Tried to access an unknown attribute: someAttribute");
    });

    it("should throw if an unknown attribute is tried to be forgotten", () => {
        store.bind("someAttribute");

        expect(() => store.forget("1", "anotherAttribute")).toThrow(
            "Tried to access an unknown attribute: anotherAttribute",
        );
    });

    it("should forget the given attribute", () => {
        store.bind("someAttribute");

        store.set("1", "someAttribute", "value");

        expect(store.has("1", "someAttribute")).toBeTrue();

        store.forget("1", "someAttribute");

        expect(store.has("1", "someAttribute")).toBeFalse();
    });

    it("should throw if an attribute is tried to be checked on an unknown attribute", () => {
        expect(() => store.has("1", "someAttribute")).toThrow("Tried to access an unknown attribute: someAttribute");
    });
});
