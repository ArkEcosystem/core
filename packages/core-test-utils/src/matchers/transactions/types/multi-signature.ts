import { constants } from "@arkecosystem/crypto";

const { MULTI_SIGNATURE } = constants.TRANSACTION_TYPES;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeMultiSignatureType(): R;
        }
    }
}

expect.extend({
    toBeMultiSignatureType: received => {
        return {
            message: () => "Expected value to be a valid MULTI_SIGNATURE transaction.",
            pass: received.type === MULTI_SIGNATURE,
        };
    },
});
