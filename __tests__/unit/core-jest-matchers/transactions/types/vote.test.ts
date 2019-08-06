import "../../../../../packages/core-jest-matchers/src/transactions/types/vote";

import { Enums } from "@arkecosystem/crypto";
const { TransactionType } = Enums;

describe(".toBeVoteType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionType.Vote }).toBeVoteType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeVoteType).toThrowError("Expected value to be a valid VOTE transaction.");
    });
});
