import { crypto } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeArkAddress(): R;
        }
    }
}

expect.extend({
    toBeArkAddress: (received, argument) => {
        return {
            message: () => "Expected value to be a valid address",
            pass: crypto.validateAddress(received, argument),
        };
    },
});
