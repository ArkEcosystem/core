import { Crypto } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toHaveValidSecondSignature(value: object): R;
        }
    }
}

expect.extend({
    toHaveValidSecondSignature: (actual, expected) => {
        let verified;

        try {
            verified = Crypto.crypto.verifySecondSignature(actual, expected.publicKey);
        } catch (e) {} // tslint:disable-line

        return {
            message: () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
