import { Enums } from "@arkecosystem/crypto";

const { MultiSignature } = Enums.TransactionType;

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
            message: () => "Expected value to be a valid MultiSignature transaction.",
            pass: received.type === MultiSignature,
        };
    },
});
