import { Enums } from "@arkecosystem/crypto";

const { Vote } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeVoteType(): R;
        }
    }
}

expect.extend({
    toBeVoteType: received => {
        return {
            message: () => "Expected value to be a valid VOTE transaction.",
            pass: received.type === Vote,
        };
    },
});
