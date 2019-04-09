import { Crypto } from "@arkecosystem/crypto";

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
    toBeValidTransaction: (transaction, network) => {
        return {
            message: () => "Expected value to be a valid transaction",
            pass: Crypto.crypto.verify(transaction),
        };
    },
});
