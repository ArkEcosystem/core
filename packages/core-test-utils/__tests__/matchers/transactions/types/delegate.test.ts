import "../../../../src/matchers/transactions/types/delegate";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeDelegateType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TRANSACTION_TYPES.DELEGATE_REGISTRATION,
        }).toBeDelegateType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeDelegateType();
    });
});
