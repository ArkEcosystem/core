import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let Utils;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    Utils = crypto.libraryManager.Utils;
});

describe("IsException", () => {
    it("should return true", () => {
        expect(Utils.isException("1")).toBeTrue();
    });

    it("should return false", () => {
        expect(Utils.isException("2")).toBeFalse();

        expect(Utils.isException("2")).toBeFalse();

        expect(Utils.isException(undefined)).toBeFalse();
    });
});
