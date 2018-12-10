import "../../../../src/matchers/transactions/types/delegate-resignation";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeDelegateResignationType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TRANSACTION_TYPES.DELEGATE_RESIGNATION,
        }).toBeDelegateResignationType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeDelegateResignationType();
    });
});
