import "jest-extended";

import { AttributeService } from "@packages/core-kernel/src/services/attributes/attribute-service";
import { AttributeIndex } from "@packages/core-kernel/src/services/attributes/attribute-index";

let indexes: AttributeService;

beforeEach(() => (indexes = new AttributeService()));

describe("AttributeService", () => {
    it("should throw if the given index does not exist in the given scope", () => {
        indexes.set("block", { scope: "queued" });

        expect(() => indexes.get("block")).toThrow("Tried to get an unknown index: block");
    });

    it("should return the given index", () => {
        indexes.set("block");

        expect(indexes.get("block")).toBeInstanceOf(AttributeIndex);
    });

    it("should throw if the given index is undefined", () => {
        expect(() => indexes.get("block")).toThrow("Tried to get an unknown index: block");
    });

    it("should throw if the given index is already set", () => {
        indexes.set("block");

        expect(() => indexes.set("block")).toThrow("Tried to set a known index: block");
    });

    it("should forget all attributes of the given index", () => {
        indexes.set("block");

        expect(indexes.get("block")).toBeInstanceOf(AttributeIndex);
        expect(indexes.has("block")).toBeTrue();

        indexes.forget("block");

        expect(() => indexes.get("block")).toThrow("Tried to get an unknown index: block");
        expect(indexes.has("block")).toBeFalse();
    });

    it("should forget all indexes of the default scope", () => {
        indexes.set("block");

        expect(indexes.get("block")).toBeInstanceOf(AttributeIndex);
        expect(indexes.has("block")).toBeTrue();

        indexes.flush();

        expect(() => indexes.get("block")).toThrow("Tried to get an unknown index: block");
        expect(indexes.has("block")).toBeFalse();
    });

    it("should forget all attributes of the given scope", () => {
        const opts: { scope: string } = { scope: "special" };

        indexes.set("block", opts);

        expect(indexes.get("block", opts)).toBeInstanceOf(AttributeIndex);
        expect(indexes.has("block", opts)).toBeTrue();

        indexes.flush("special");

        expect(() => indexes.get("block", opts)).toThrow("Tried to get an unknown index: block");
        expect(indexes.has("block", opts)).toBeFalse();
    });
});
