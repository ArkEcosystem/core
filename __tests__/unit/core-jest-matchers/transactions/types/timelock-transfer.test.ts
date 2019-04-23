import "../../../../../packages/core-jest-matchers/src/transactions/types/timelock-transfer";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeTimelockTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.TimelockTransfer,
        }).toBeTimelockTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeTimelockTransferType).toThrowError(
            "Expected value to be a valid TimelockTransfer transaction.",
        );
    });
});
