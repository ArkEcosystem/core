import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeWallet(): R;
        }
    }
}

expect.extend({
    toBeWallet: (actual) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid wallet",
            pass: Utils.isEqual(Utils.sortBy(Object.keys(actual)), ["address", "publicKey"]),
        };
    },
});
