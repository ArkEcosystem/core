import { TransactionsManager } from "@arkecosystem/core-crypto";

import { createDefaultTransactionManager } from "../../utils/transaction-manager";

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
    toHaveValidSecondSignature: (
        actual,
        expected,
        transactionManager: TransactionsManager = createDefaultTransactionManager(),
    ) => {
        let verified: boolean = false;
        try {
            verified = transactionManager.Verifier.verifySecondSignature(actual, expected.publicKey);
        } catch {}

        return {
            message: /* istanbul ignore next */ () => "Expected value to have a valid second signature",
            pass: !!verified,
        };
    },
});
