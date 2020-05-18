import "jest-extended";

import { CryptoManager } from "@packages/core-crypto";
import { Validator } from "@packages/core-crypto/src/validation/index";

let ajv;
let crypto: CryptoManager;

beforeAll(() => {
    crypto = CryptoManager.createFromPreset("devnet");
    const validator = Validator.make(crypto);
    ajv = validator.getInstance();
});

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
        crypto.MilestoneManager.getMilestone().vendorFieldLength = 255;
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeTrue();
        expect(validate("⊁".repeat(85))).toBeTrue();
        expect(validate("a".repeat(256))).toBeFalse();
        expect(validate("⊁".repeat(86))).toBeFalse();
    });
});
