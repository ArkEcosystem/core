import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeTransaction(): R;
        }
    }
}

expect.extend({
    toBeTransaction: actual => {
        // TODO based on type
        const allowedKeys = Utils.sortBy(["id", "type", "amount", "fee", "timestamp", "signature"]);
        const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key));

        return {
            message: () => "Expected value to be a valid transaction",
            pass: Utils.isEqual(Utils.sortBy(actualKeys), allowedKeys),
        };
    },
});
