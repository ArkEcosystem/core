import { Enums } from "@arkecosystem/crypto";
const { DelegateResignation } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeDelegateResignationType(): R;
        }
    }
}

expect.extend({
    toBeDelegateResignationType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid DelegateResignation transaction.",
            pass: received.type === DelegateResignation,
        };
    },
});
