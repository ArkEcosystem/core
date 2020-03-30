import { Enums } from "@arkecosystem/crypto";

const { Transfer } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeTransferType(): R;
        }
    }
}

expect.extend({
    toBeTransferType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid Transfer transaction.",
            pass: received.type === Transfer,
        };
    },
});
