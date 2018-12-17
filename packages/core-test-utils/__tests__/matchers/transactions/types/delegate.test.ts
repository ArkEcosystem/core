import "../../../../src/matchers/transactions/types/delegate";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeDelegateType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.DelegateRegistration,
        }).toBeDelegateType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeDelegateType();
    });
});
