import "../../../src/transactions/types/timelock-transfer";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeTimelockTransferType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.TimelockTransfer,
        }).toBeTimelockTransferType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeTimelockTransferType();
    });
});
