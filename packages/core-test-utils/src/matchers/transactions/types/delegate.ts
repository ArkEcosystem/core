import { constants } from "@arkecosystem/crypto";

const { DELEGATE_REGISTRATION } = constants.TRANSACTION_TYPES;

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
            pass: received.type === DELEGATE_REGISTRATION,
        };
    },
});
