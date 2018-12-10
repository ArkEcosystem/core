import "jest-extended";

import { TRANSACTION_TYPES } from "../../src/constants";
import { feeManager } from "../../src/managers/fee";

describe("Fee Manager", () => {
    it("should be instantiated", () => {
        expect(feeManager).toBeObject();
    });

    it("should set the fee", () => {
        feeManager.set(TRANSACTION_TYPES.TRANSFER, 1);

        expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(1);
    });

    it("should get multisignature fee (keysgroup length + 1)", () => {
        const transaction = {
            type: TRANSACTION_TYPES.MULTI_SIGNATURE,
            asset: {
                multisignature: {
                    keysgroup: [1, 2, 3],
                },
            },
        };

        feeManager.set(TRANSACTION_TYPES.MULTI_SIGNATURE, 1);

        expect(feeManager.getForTransaction(transaction)).toEqual(4);
    });
});
