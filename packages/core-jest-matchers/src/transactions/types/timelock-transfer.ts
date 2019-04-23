import { Enums } from "@arkecosystem/crypto";

const { TimelockTransfer } = Enums.TransactionTypes;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeTimelockTransferType(): R;
        }
    }
}

expect.extend({
    toBeTimelockTransferType: received => {
        return {
            message: () => "Expected value to be a valid TimelockTransfer transaction.",
            pass: received.type === TimelockTransfer,
        };
    },
});
