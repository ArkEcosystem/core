import { constants } from "@arkecosystem/crypto";
const { DELEGATE_RESIGNATION } = constants.TRANSACTION_TYPES;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeDelegateResignationType(): R;
        }
    }
}

expect.extend({
    toBeDelegateResignationType: received => {
        return {
            message: () => "Expected value to be a valid DELEGATE_RESIGNATION transaction.",
            pass: received.type === DELEGATE_RESIGNATION,
        };
    },
});
