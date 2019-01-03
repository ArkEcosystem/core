import { crypto } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeArkPublicKey(): R;
        }
    }
}

expect.extend({
    toBeArkPublicKey: received => {
        return {
            message: () => "Expected value to be a valid public key",
            pass: crypto.validatePublicKey(received),
        };
    },
});
