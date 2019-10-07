import { Identities } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeAddress(): R;
        }
    }
}

expect.extend({
    toBeAddress: (received, argument) => {
        return {
            message: () => "Expected value to be a valid address",
            pass: Identities.Address.validate(received, argument),
        };
    },
});
