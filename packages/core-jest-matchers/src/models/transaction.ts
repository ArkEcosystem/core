import { sortBy } from "@arkecosystem/utils";
import isEqual from "lodash.isequal";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeTransaction(): R;
        }
    }
}

expect.extend({
    toBeTransaction: actual => {
        // TODO based on type
        const allowedKeys = sortBy(["id", "type", "amount", "fee", "timestamp", "signature"]);
        const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key));

        return {
            message: () => "Expected value to be a valid transaction",
            pass: isEqual(sortBy(actualKeys), allowedKeys),
        };
    },
});
