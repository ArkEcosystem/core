import "../../../src/transactions/types/vote";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeVoteType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionTypes.Vote }).toBeVoteType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeVoteType();
    });
});
