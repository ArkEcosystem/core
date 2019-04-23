import "../../../../../packages/core-jest-matchers/src/transactions/types/delegate-resignation";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeDelegateResignationType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.DelegateResignation,
        }).toBeDelegateResignationType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeDelegateResignationType).toThrowError(
            "Expected value to be a valid DelegateResignation transaction.",
        );
    });
});
