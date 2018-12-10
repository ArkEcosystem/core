import * as _ from "lodash";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeDelegate(): R;
        }
    }
}

expect.extend({
    toBeDelegate: actual => {
        return {
            message: () => "Expected value to be a valid delegate",
            pass: _.isEqual(_.sortBy(Object.keys(actual)), ["address", "publicKey", "username"]),
        };
    },
});
