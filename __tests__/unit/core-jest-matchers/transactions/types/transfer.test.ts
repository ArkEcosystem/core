import "../../../../../packages/core-jest-matchers/src/transactions/types/transfer";

import { Enums } from "@arkecosystem/crypto";
const { TransactionType } = Enums;

describe(".toBeTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionType.Transfer }).toBeTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeTransferType).toThrowError(
            "Expected value to be a valid Transfer transaction.",
        );
    });
});
