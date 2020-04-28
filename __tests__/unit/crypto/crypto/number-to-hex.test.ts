import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let Crypto;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    Crypto = crypto.libraryManager.Crypto;
});

describe("NumberToHex", () => {
    it("should be ok", () => {
        expect(Crypto.numberToHex(10)).toBe("0a");
        expect(Crypto.numberToHex(1)).toBe("01");
        expect(Crypto.numberToHex(16)).toBe("10");
        expect(Crypto.numberToHex(16, 4)).toBe("0010");
    });
});
