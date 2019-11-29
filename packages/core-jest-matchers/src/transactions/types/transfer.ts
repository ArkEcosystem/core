import { Enums } from "@arkecosystem/crypto";

const { Transfer } = Enums.TransactionType;

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
            message: () => "Expected value to be a valid Transfer transaction.",
            pass: received.type === Transfer,
        };
    },
});
