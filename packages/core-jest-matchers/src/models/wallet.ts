import { sortBy } from "@arkecosystem/utils";
import isEqual from "lodash.isequal";

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
            pass: isEqual(sortBy(Object.keys(actual)), ["address", "publicKey"]),
        };
    },
});
