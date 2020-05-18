import { Transactions } from "@arkecosystem/crypto";

import { createDefaultTransactionManager } from "../../utils/transaction-manager";

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
    toBeValidTransaction: (
        actual,
        transactionTools: Transactions.TransactionTools<any> = createDefaultTransactionManager(),
    ) => {
        let verified = false;

        try {
            verified = transactionTools.Verifier.verifyHash(actual);
        } catch {}

        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid transaction",
            pass: !!verified,
        };
    },
});
