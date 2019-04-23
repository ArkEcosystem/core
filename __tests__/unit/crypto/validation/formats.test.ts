import "jest-extended";

import { configManager } from "../../../../packages/crypto/src/managers";
import { validator } from "../../../../packages/crypto/src/validation";

const ajv = validator.getInstance();

describe("format vendorField", () => {
    it("should be ok with 64 bytes", () => {
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);

        expect(validate("1234")).toBeTrue();
        expect(validate("a".repeat(64))).toBeTrue();
        expect(validate("a".repeat(65))).toBeFalse();
        expect(validate("⊁".repeat(21))).toBeTrue();
        expect(validate("⊁".repeat(22))).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(null)).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });

    it("should not be ok with over 64 bytes without milestone ", () => {
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeFalse();
    });

    it("should be ok with up to 255 bytes with milestone ", () => {
        configManager.getMilestone().vendorFieldLength = 255;
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeTrue();
        expect(validate("⊁".repeat(85))).toBeTrue();
        expect(validate("a".repeat(256))).toBeFalse();
        expect(validate("⊁".repeat(86))).toBeFalse();

        configManager.getMilestone().vendorFieldLength = 64;
    });
});

describe("format vendorFieldHex", () => {
    it("should be ok with 128 hex", () => {
        const schema = { type: "string", format: "vendorFieldHex" };
        const validate = ajv.compile(schema);

        expect(validate("affe".repeat(32))).toBeTrue();
        expect(validate("affe".repeat(33))).toBeFalse();
        expect(validate("⊁".repeat(22))).toBeFalse();
    });

    it("should be ok with 510 hex when milestone vendorFieldLength=255 is active", () => {
        configManager.getMilestone().vendorFieldLength = 255;
        const schema = { type: "string", format: "vendorFieldHex" };
        const validate = ajv.compile(schema);

        expect(validate("affe".repeat(127))).toBeTrue();
        expect(validate("affe".repeat(128))).toBeFalse();

        configManager.getMilestone().vendorFieldLength = 64;
    });

    it("should not be ok with non hex", () => {
        const schema = { type: "string", format: "vendorFieldHex" };
        const validate = ajv.compile(schema);
        expect(validate("Z")).toBeFalse();
        expect(validate("Zaffe")).toBeFalse();
        expect(validate("⊁")).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(null)).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });
});
