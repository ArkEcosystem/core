import { Transactions } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveValidSecondSignature(value: object): R;
        }
    }
}

expect.extend({
    toHaveValidSecondSignature: (actual, expected) => {
        let verified: boolean;
        try {
            verified = Transactions.Verifier.verifySecondSignature(actual, expected.publicKey);
        } catch {}

        return {
            message: () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
