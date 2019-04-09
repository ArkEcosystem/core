import { Crypto } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBePublicKey(): R;
        }
    }
}

expect.extend({
    toBePublicKey: received => {
        return {
            message: () => "Expected value to be a valid public key",
            pass: Crypto.crypto.validatePublicKey(received),
        };
    },
});
