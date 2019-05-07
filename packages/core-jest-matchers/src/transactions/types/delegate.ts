import { Enums } from "@arkecosystem/crypto";

const { TransactionTypes } = Enums;

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
            pass: received.type === TransactionTypes.DelegateRegistration ||
                  received.type === TransactionTypes.DelegateResignation,
        };
    },
});
