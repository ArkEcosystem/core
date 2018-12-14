import "../../../../src/matchers/transactions/types/vote";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeVoteType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TRANSACTION_TYPES.VOTE }).toBeVoteType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeVoteType();
    });
});
