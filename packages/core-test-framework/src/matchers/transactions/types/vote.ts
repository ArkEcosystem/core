import { Enums } from "@arkecosystem/crypto";

const { Vote } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeVoteType(): R;
        }
    }
}

expect.extend({
    toBeVoteType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid VOTE transaction.",
            pass: received.type === Vote,
        };
    },
});
