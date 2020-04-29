import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { SATOSHI } from "../../../../packages/crypto/src/constants";

let BigNumber;
let Utils;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    BigNumber = crypto.LibraryManager.Libraries.BigNumber;
    Utils = crypto.LibraryManager.Utils;
});

describe("Format Satoshi", () => {
    it("should format satoshis", () => {
        expect(Utils.formatSatoshi(BigNumber.make(SATOSHI))).toBe("1 DѦ");
        expect(Utils.formatSatoshi(BigNumber.make(0.1 * SATOSHI))).toBe("0.1 DѦ");
        expect(Utils.formatSatoshi(BigNumber.make((0.1 * SATOSHI).toString()))).toBe("0.1 DѦ");
        expect(Utils.formatSatoshi(BigNumber.make(10))).toBe("0.0000001 DѦ");
        expect(Utils.formatSatoshi(BigNumber.make(SATOSHI + 10012))).toBe("1.00010012 DѦ");
    });
});
