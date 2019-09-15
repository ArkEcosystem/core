import "../../../../../packages/core-jest-matchers/src/transactions/types/delegate-resignation";

import { Enums } from "@arkecosystem/crypto";
const { TransactionType } = Enums;

describe(".toBeDelegateResignationType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionType.DelegateResignation,
        }).toBeDelegateResignationType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeDelegateResignationType).toThrowError(
            "Expected value to be a valid DelegateResignation transaction.",
        );
    });
});
