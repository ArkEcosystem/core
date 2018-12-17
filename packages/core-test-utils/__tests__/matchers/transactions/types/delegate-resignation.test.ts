import "../../../../src/matchers/transactions/types/delegate-resignation";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeDelegateResignationType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.DelegateResignation,
        }).toBeDelegateResignationType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeDelegateResignationType();
    });
});
