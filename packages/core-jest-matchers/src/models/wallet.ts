import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWallet(): R;
        }
    }
}

expect.extend({
    toBeWallet: actual => {
        return {
            message: () => "Expected value to be a valid wallet",
            pass: Utils.isEqual(Utils.sortBy(Object.keys(actual)), ["address", "publicKey"]),
        };
    },
});
