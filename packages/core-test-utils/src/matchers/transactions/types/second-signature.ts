import { constants } from "@arkecosystem/crypto";

const { SECOND_SIGNATURE } = constants.TRANSACTION_TYPES;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeSecondSignatureType(): R;
        }
    }
}

expect.extend({
    toBeSecondSignatureType: received => {
        return {
            message: () => "Expected value to be a valid SECOND_SIGNATURE transaction.",
            pass: received.type === SECOND_SIGNATURE,
        };
    },
});
