import { Enums } from "@arkecosystem/crypto";
const { DelegateResignation } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeDelegateResignationType(): R;
        }
    }
}

expect.extend({
    toBeDelegateResignationType: received => {
        return {
            message: () => "Expected value to be a valid DelegateResignation transaction.",
            pass: received.type === DelegateResignation,
        };
    },
});
