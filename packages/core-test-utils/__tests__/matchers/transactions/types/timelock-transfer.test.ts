import "../../../../src/matchers/transactions/types/timelock-transfer";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeTimelockTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TRANSACTION_TYPES.TIMELOCK_TRANSFER,
        }).toBeTimelockTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeTimelockTransferType();
    });
});
