import "jest-extended";

import { AttributeSet } from "@packages/core-kernel/src/services/attributes/attribute-set";

let set: AttributeSet;

beforeEach(() => (set = new AttributeSet()));

describe("AttributeSet", () => {
    it("should all return all attributes", () => {
        set.set("someAttribute1");
        set.set("someAttribute2");

        expect(set.all()).toEqual(["someAttribute1", "someAttribute2"]);
    });

    it("should set and forget an attribute", () => {
        set.set("someAttribute");

        expect(set.has("someAttribute")).toBeTrue();

        expect(set.forget("someAttribute")).toBeTrue();

        expect(set.has("someAttribute")).toBeFalse();
    });

    it("should set and forget multiple attributes", () => {
        set.set("someAttribute1");
        set.set("someAttribute2");

        expect(set.has("someAttribute1")).toBeTrue();
        expect(set.has("someAttribute2")).toBeTrue();

        expect(set.flush()).toBeTrue();

        expect(set.has("someAttribute1")).toBeFalse();
        expect(set.has("someAttribute2")).toBeFalse();
    });

    it("should throw if a duplicate attribute is tried to be set", () => {
        set.set("someAttribute");

        expect(() => set.set("someAttribute")).toThrow("Duplicated attribute: someAttribute");
    });

    it("should throw if an unknown attribute is tried to be forgotten", () => {
        expect(() => set.forget("someAttribute")).toThrow("Unknown attribute: someAttribute");
    });
});
