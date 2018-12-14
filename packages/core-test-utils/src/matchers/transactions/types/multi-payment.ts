import { constants } from "@arkecosystem/crypto";

const { MULTI_PAYMENT } = constants.TRANSACTION_TYPES;

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
            message: () => "Expected value to be a valid MULTI_PAYMENT transaction.",
            pass: received.type === MULTI_PAYMENT,
        };
    },
});
