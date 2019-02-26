import "jest-extended";

import { configManager } from "../../src";
import { AjvWrapper } from "../../src/validation";

const ajv = AjvWrapper.instance();

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
        configManager.getMilestone().vendorField255 = true;
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeTrue();
        expect(validate("⊁".repeat(85))).toBeTrue();
        expect(validate("a".repeat(256))).toBeFalse();
        expect(validate("⊁".repeat(86))).toBeFalse();

        configManager.getMilestone().vendorField255 = false;
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

    it("should be ok with 510 hex when milestone vendorField255 is active", () => {
        configManager.getMilestone().vendorField255 = true;
        const schema = { type: "string", format: "vendorFieldHex" };
        const validate = ajv.compile(schema);

        expect(validate("affe".repeat(127))).toBeTrue();
        expect(validate("affe".repeat(128))).toBeFalse();

        configManager.getMilestone().vendorField255 = false;
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
