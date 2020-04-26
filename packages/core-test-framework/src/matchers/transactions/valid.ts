import { Transactions } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeValidTransaction(): R;
        }
    }
}

expect.extend({
    toBeValidTransaction: (actual) => {
        let verified = false;

        try {
            verified = Transactions.Verifier.verifyHash(actual);
        } catch {}

        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid transaction",
            pass: !!verified,
        };
    },
});
