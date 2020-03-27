import { Identities } from "@arkecosystem/crypto";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeAddress(): R;
        }
    }
}

expect.extend({
    toBeAddress: (received, argument) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid address",
            pass: Identities.Address.validate(received, argument),
        };
    },
});
