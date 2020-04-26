import { Enums } from "@arkecosystem/crypto";

const { MultiPayment } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeMultiPaymentType(): R;
        }
    }
}

expect.extend({
    toBeMultiPaymentType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid MultiPayment transaction.",
            pass: received.type === MultiPayment,
        };
    },
});
