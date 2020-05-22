import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { formatTimestamp } from "@packages/core-kernel/src/utils/format-timestamp";

let crypto: CryptoSuite.CryptoSuite;

beforeAll(() => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
});

describe("Format Timestamp", () => {
    it("should compute the correct epoch value", () => {
        expect(formatTimestamp(100, crypto.CryptoManager).epoch).toBe(100);
    });

    it("should compute the correct unix value", () => {
        expect(formatTimestamp(100, crypto.CryptoManager).unix).toBe(1490101300);
    });

    it("should compute the correct human value", () => {
        expect(formatTimestamp(100, crypto.CryptoManager).human).toBe("2017-03-21T13:01:40.000Z");
    });
});
