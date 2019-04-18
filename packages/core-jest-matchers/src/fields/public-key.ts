import { Identities } from "@arkecosystem/crypto";

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
            pass: Identities.PublicKey.validate(received),
        };
    },
});
