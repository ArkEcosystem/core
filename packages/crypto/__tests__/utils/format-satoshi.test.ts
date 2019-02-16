import "jest-extended";

import { SATOSHI } from "../../src/constants";
import { Bignum, formatSatoshi } from "../../src/utils";

describe("Format Satoshi", () => {
    it("should format satoshis", () => {
        expect(formatSatoshi(SATOSHI)).toBe("1 DѦ");
        expect(formatSatoshi(0.1 * SATOSHI)).toBe("0.1 DѦ");
        expect(formatSatoshi((0.1 * SATOSHI).toString())).toBe("0.1 DѦ");
        expect(formatSatoshi(new Bignum(10))).toBe("0.0000001 DѦ");
        expect(formatSatoshi(new Bignum(SATOSHI + 10012))).toBe("1.00010012 DѦ");
    });
});
