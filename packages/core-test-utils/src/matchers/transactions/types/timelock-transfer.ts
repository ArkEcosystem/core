import { constants } from "@arkecosystem/crypto";

const { TIMELOCK_TRANSFER } = constants.TRANSACTION_TYPES;

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
            message: () => "Expected value to be a valid TIMELOCK_TRANSFER transaction.",
            pass: received.type === TIMELOCK_TRANSFER,
        };
    },
});
