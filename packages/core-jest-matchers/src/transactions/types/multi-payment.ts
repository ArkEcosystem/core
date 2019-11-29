import { Enums } from "@arkecosystem/crypto";

const { MultiPayment } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeMultiPaymentType(): R;
        }
    }
}

expect.extend({
    toBeMultiPaymentType: received => {
        return {
            message: () => "Expected value to be a valid MultiPayment transaction.",
            pass: received.type === MultiPayment,
        };
    },
});
