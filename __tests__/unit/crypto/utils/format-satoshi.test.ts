import "jest-extended";

import { SATOSHI } from "../../../../packages/crypto/src/constants";
import { BigNumber, formatSatoshi } from "../../../../packages/crypto/src/utils";

describe("Format Satoshi", () => {
    it("should format satoshis", () => {
        expect(formatSatoshi(BigNumber.make(SATOSHI))).toBe("1 DѦ");
        expect(formatSatoshi(BigNumber.make(0.1 * SATOSHI))).toBe("0.1 DѦ");
        expect(formatSatoshi(BigNumber.make((0.1 * SATOSHI).toString()))).toBe("0.1 DѦ");
        expect(formatSatoshi(BigNumber.make(10))).toBe("0.0000001 DѦ");
        expect(formatSatoshi(BigNumber.make(SATOSHI + 10012))).toBe("1.00010012 DѦ");
    });
});
