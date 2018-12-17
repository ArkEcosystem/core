import { constants } from "@arkecosystem/crypto";

const { DelegateRegistration } = constants.TransactionTypes;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeDelegateType(): R;
        }
    }
}

expect.extend({
    toBeDelegateType: received => {
        return {
            message: () => "Expected value to be a valid DELEGATE transaction.",
            pass: received.type === DelegateRegistration,
        };
    },
});
