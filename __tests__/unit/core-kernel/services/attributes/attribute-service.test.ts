import "jest-extended";

import { AttributeService } from "@packages/core-kernel/src/services/attributes/attribute-service";
import { AttributeSet } from "@packages/core-kernel/src/services/attributes/attribute-set";
import { AttributeMap } from "@packages/core-kernel/src/services/attributes/attribute-map";

let indexes: AttributeService;

beforeEach(() => (indexes = new AttributeService()));

describe("AttributeService", () => {
    it("should throw if the given index does not exist in the given scope", () => {
        indexes.set("block", new AttributeSet(), { scope: "queued" });

        expect(() => indexes.get("block")).toThrow("Unknown index: block");
    });

    it("should return the given index", () => {
        indexes.set("block", new AttributeSet());

        expect(indexes.get("block")).toBeInstanceOf(AttributeMap);
    });

    it("should throw if the given index is undefined", () => {
        expect(() => indexes.get("block")).toThrow("Unknown index: block");
    });

    it("should throw if the given index is already set", () => {
        indexes.set("block", new AttributeSet());

        expect(() => indexes.set("block", new AttributeSet())).toThrow("Duplicate index: block");
    });

    it("should forget all attributes of the given index", () => {
        indexes.set("block", new AttributeSet());

        expect(indexes.get("block")).toBeInstanceOf(AttributeMap);
        expect(indexes.has("block")).toBeTrue();

        indexes.forget("block");

        expect(() => indexes.get("block")).toThrow("Unknown index: block");
        expect(indexes.has("block")).toBeFalse();
    });

    it("should forget all indexes of the default scope", () => {
        indexes.set("block", new AttributeSet());

        expect(indexes.get("block")).toBeInstanceOf(AttributeMap);
        expect(indexes.has("block")).toBeTrue();

        indexes.flush();

        expect(() => indexes.get("block")).toThrow("Unknown index: block");
        expect(indexes.has("block")).toBeFalse();
    });

    it("should forget all attributes of the given scope", () => {
        const opts: { scope: string } = { scope: "special" };

        indexes.set("block", new AttributeSet(), opts);

        expect(indexes.get("block", opts)).toBeInstanceOf(AttributeMap);
        expect(indexes.has("block", opts)).toBeTrue();

        indexes.flush("special");

        expect(() => indexes.get("block", opts)).toThrow("Unknown index: block");
        expect(indexes.has("block", opts)).toBeFalse();
    });
});
