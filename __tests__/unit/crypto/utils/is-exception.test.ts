import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let Utils;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    Utils = crypto.libraryManager.Utils;
});

describe("IsException", () => {
    it("should return true for block exception", () => {
        expect(Utils.isException("15895730198424359628")).toBeTrue();
    });

    it("should return true for transaction exception", () => {
        expect(Utils.isException("76bd168e57a4431a64617c4e7864df1e0be89831eabaa230e37643efae2def6f")).toBeTrue();
    });

    it("should return false", () => {
        expect(Utils.isException("2")).toBeFalse();

        expect(Utils.isException("2")).toBeFalse();

        expect(Utils.isException(undefined)).toBeFalse();
    });
});
