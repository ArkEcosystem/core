import "jest-extended";

import { ARKTOSHI } from "../../src/constants";
import { Bignum, formatArktoshi } from "../../src/utils";

describe("Format Arktoshi", () => {
    it("should format arktoshis", () => {
      expect(formatArktoshi(ARKTOSHI)).toBe("DѦ0.00000001");
      expect(formatArktoshi(0.1 * ARKTOSHI)).toBe("DѦ0.10000000");
      expect(formatArktoshi((0.1 * ARKTOSHI).toString())).toBe("DѦ0.10000000");
      expect(formatArktoshi(new Bignum(10))).toBe("DѦ0.00000010");
      expect(formatArktoshi(new Bignum(ARKTOSHI + 10012))).toBe("DѦ1.00010012");
    });
});
