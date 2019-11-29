import { Enums } from "@arkecosystem/crypto";

const { DelegateRegistration } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeDelegateRegistrationType(): R;
        }
    }
}

expect.extend({
    toBeDelegateRegistrationType: received => {
        return {
            message: () => "Expected value to be a valid DELEGATE transaction.",
            pass: received.type === DelegateRegistration,
        };
    },
});
