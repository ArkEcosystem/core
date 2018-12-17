import "../../../../src/matchers/transactions/types/transfer";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionTypes.Transfer }).toBeTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeTransferType();
    });
});
