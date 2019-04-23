import "../../../../../packages/core-jest-matchers/src/transactions/types/delegate";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeDelegateType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.DelegateRegistration,
        }).toBeDelegateType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeDelegateType).toThrowError(
            "Expected value to be a valid DELEGATE transaction.",
        );
    });
});
