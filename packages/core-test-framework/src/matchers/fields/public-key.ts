import { Identities } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBePublicKey(): R;
        }
    }
}

expect.extend({
    toBePublicKey: received => {
        return {
            message: () => "Expected value to be a valid public key",
            pass: Identities.PublicKey.validate(received),
        };
    },
});
