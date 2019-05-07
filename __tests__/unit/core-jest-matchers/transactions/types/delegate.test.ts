import "../../../../../packages/core-jest-matchers/src/transactions/types/delegate";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeDelegateType", () => {
    test("passes when given a delegate transaction", () => {
        expect({
            type: TransactionTypes.DelegateRegistration,
        }).toBeDelegateType();

        expect({
            type: TransactionTypes.DelegateResignation,
        }).toBeDelegateType();
    });

    test("fails when given a non-delegate transaction", () => {
        expect(expect({ type: "invalid" }).toBeDelegateType).toThrowError(
            "Expected value to be a valid DELEGATE transaction.",
        );
    });
});
