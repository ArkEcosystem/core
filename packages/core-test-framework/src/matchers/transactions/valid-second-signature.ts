import { Transactions } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toHaveValidSecondSignature(value: object): R;
        }
    }
}

expect.extend({
    toHaveValidSecondSignature: (actual, expected) => {
        let verified: boolean = false;
        try {
            verified = Transactions.Verifier.verifySecondSignature(actual, expected.publicKey);
        } catch {}

        return {
            message: /* istanbul ignore next */ () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
