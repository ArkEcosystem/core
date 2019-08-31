import { Transactions } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidTransaction(): R;
        }
    }
}

expect.extend({
    toBeValidTransaction: actual => {
        let verified = false;

        try {
            verified = Transactions.Verifier.verifyHash(actual);
        } catch {}

        return {
            message: () => "Expected value to be a valid transaction",
            pass: !!verified,
        };
    },
});
