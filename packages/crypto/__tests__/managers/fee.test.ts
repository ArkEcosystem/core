import "jest-extended";

import { TransactionTypes } from "../../src/constants";
import { feeManager } from "../../src/managers/fee";
import { ITransactionData } from "../../src/models";

describe("Fee Manager", () => {
    it("should be instantiated", () => {
        expect(feeManager).toBeObject();
    });

    it("should set the fee", () => {
        feeManager.set(TransactionTypes.Transfer, 1);

        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(1);
    });

    it("should get multisignature fee (keysgroup length + 1)", () => {
        const transaction = {
            type: TransactionTypes.MultiSignature,
            asset: {
                multisignature: {
                    keysgroup: ["1", "2", "3"]
                },
            },
        } as ITransactionData;

        feeManager.set(TransactionTypes.MultiSignature, 1);

        expect(feeManager.getForTransaction(transaction)).toEqual(4);
    });
});
