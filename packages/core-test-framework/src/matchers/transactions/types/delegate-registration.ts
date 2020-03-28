import { Enums } from "@arkecosystem/crypto";

const { DelegateRegistration } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeDelegateRegistrationType(): R;
        }
    }
}

expect.extend({
    toBeDelegateRegistrationType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid DELEGATE transaction.",
            pass: received.type === DelegateRegistration,
        };
    },
});
