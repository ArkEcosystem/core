import "jest-extended";

import { numberToHex } from "../../../../packages/crypto/src/utils";

describe("NumberToHex", () => {
    it("should be ok", () => {
        expect(numberToHex(10)).toBe("0a");
        expect(numberToHex(1)).toBe("01");
        expect(numberToHex(16)).toBe("10");
        expect(numberToHex(16, 4)).toBe("0010");
    });
});
