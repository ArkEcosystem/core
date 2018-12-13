import "../../../../src/matchers/transactions/types/transfer";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TRANSACTION_TYPES.TRANSFER }).toBeTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeTransferType();
    });
});
