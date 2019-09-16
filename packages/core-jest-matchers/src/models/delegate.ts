import { Utils } from "@arkecosystem/core-kernel";
import { sortBy } from "@arkecosystem/utils";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeDelegate(): R;
        }
    }
}

expect.extend({
    toBeDelegate: actual => {
        return {
            message: () => "Expected value to be a valid delegate",
            pass: Utils.isEqual(sortBy(Object.keys(actual)), ["address", "publicKey", "username"]),
        };
    },
});
