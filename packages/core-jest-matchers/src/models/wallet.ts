import { Utils } from "@arkecosystem/core-kernel";
import { sortBy } from "@arkecosystem/utils";

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
            pass: Utils.isEqual(sortBy(Object.keys(actual)), ["address", "publicKey"]),
        };
    },
});
