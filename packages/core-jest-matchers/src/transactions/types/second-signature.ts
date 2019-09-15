import { Enums } from "@arkecosystem/crypto";

const { SecondSignature } = Enums.TransactionType;

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
            message: () => "Expected value to be a valid SecondSignature transaction.",
            pass: received.type === SecondSignature,
        };
    },
});
