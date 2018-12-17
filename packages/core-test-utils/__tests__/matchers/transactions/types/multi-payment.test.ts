import "../../../../src/matchers/transactions/types/multi-payment";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeMultiPaymentType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionTypes.MultiPayment }).toBeMultiPaymentType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeMultiPaymentType();
    });
});
