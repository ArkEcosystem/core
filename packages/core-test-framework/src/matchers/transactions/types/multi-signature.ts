import { Enums } from "@arkecosystem/crypto";

const { MultiSignature } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeMultiSignatureType(): R;
        }
    }
}

expect.extend({
    toBeMultiSignatureType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid MultiSignature transaction.",
            pass: received.type === MultiSignature,
        };
    },
});
