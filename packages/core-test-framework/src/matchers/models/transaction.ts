import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeTransaction(): R;
        }
    }
}

expect.extend({
    toBeTransaction: (actual) => {
        // TODO based on type
        const allowedKeys = Utils.sortBy(["id", "type", "amount", "fee", "timestamp", "signature"]);
        const actualKeys = Object.keys(actual).filter((key) => allowedKeys.includes(key));

        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid transaction",
            pass: Utils.isEqual(Utils.sortBy(actualKeys), allowedKeys),
        };
    },
});
