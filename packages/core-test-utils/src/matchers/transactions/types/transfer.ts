import { constants } from "@arkecosystem/crypto";

const { TRANSFER } = constants.TRANSACTION_TYPES;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeTransferType(): R;
        }
    }
}

expect.extend({
    toBeTransferType: received => {
        return {
            message: () => "Expected value to be a valid TRANSFER transaction.",
            pass: received.type === TRANSFER,
        };
    },
});
