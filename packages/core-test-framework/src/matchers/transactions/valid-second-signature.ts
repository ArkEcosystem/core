import { CryptoSuite } from "@arkecosystem/core-crypto";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toHaveValidSecondSignature(value: object, transactionTools: CryptoSuite.TransactionTools): R;
        }
    }
}

expect.extend({
    toHaveValidSecondSignature: (actual, expected, transactionTools: CryptoSuite.TransactionTools) => {
        let verified: boolean = false;
        try {
            verified = transactionTools.Verifier.verifySecondSignature(actual, expected.publicKey);
        } catch {}

        return {
            message: /* istanbul ignore next */ () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
