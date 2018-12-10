import "jest-extended";

import { ARKTOSHI } from "../../src/constants";
import { Bignum, formatArktoshi } from "../../src/utils";

describe("Format Arktoshi", () => {
    it("should format arktoshis", () => {
        expect(formatArktoshi(ARKTOSHI)).toBe("1 DѦ");
        expect(formatArktoshi(0.1 * ARKTOSHI)).toBe("0.1 DѦ");
        expect(formatArktoshi((0.1 * ARKTOSHI).toString())).toBe("0.1 DѦ");
        expect(formatArktoshi(new Bignum(10))).toBe("0.0000001 DѦ");
        expect(formatArktoshi(new Bignum(ARKTOSHI + 10012))).toBe("1.00010012 DѦ");
    });
});
