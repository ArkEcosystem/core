import "../../../../src/matchers/transactions/types/multi-payment";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeMultiPaymentType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TRANSACTION_TYPES.MULTI_PAYMENT }).toBeMultiPaymentType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeMultiPaymentType();
    });
});
