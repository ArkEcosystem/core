import { Enums } from "@arkecosystem/crypto";

const { SecondSignature } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeSecondSignatureType(): R;
        }
    }
}

expect.extend({
    toBeSecondSignatureType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid SecondSignature transaction.",
            pass: received.type === SecondSignature,
        };
    },
});
