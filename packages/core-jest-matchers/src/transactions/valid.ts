import { Transactions } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeValidTransaction(): R;
        }
    }
}

expect.extend({
    toBeValidTransaction: actual => {
        let verified: boolean = false;

        try {
            verified = Transactions.Verifier.verifyHash(actual);
        } catch (e) {} // tslint:disable-line

        return {
            message: () => "Expected value to be a valid transaction",
            pass: !!verified,
        };
    },
});
