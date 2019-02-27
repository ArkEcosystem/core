import "../../../../packages/core-jest-matchers/src/fields/public-key";

describe(".toBePublicKey", () => {
    test("passes when given a valid public key", () => {
        expect("022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d").toBePublicKey();
    });

    test("fails when not given a valid public key", () => {
        expect(expect("invalid-pubkey").toBePublicKey).toThrowError("Expected value to be a valid public key");
    });
});
