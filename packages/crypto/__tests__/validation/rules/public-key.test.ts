import "jest-extended";

import { publicKey } from "../../../src/validation/rules/public-key";

describe("Public Key Rule", () => {
    it("should be true", () => {
        expect(publicKey("022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d").passes).toBeTrue();
    });

    it("should be false", () => {
        expect(publicKey("_022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d_").passes).toBeFalse();
    });
});
