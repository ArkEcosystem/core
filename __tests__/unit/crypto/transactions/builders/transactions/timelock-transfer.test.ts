import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { TimelockTransferBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/timelock-transfer";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: TimelockTransferBuilder;

beforeEach(() => {
    builder = BuilderFactory.timelockTransfer();
});

describe("Timelock Transfer Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.TimelockTransfer);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.TimelockTransfer));
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.timelockType", 0x00);
        expect(builder).toHaveProperty("data.timelock", undefined);
    });

    describe("timelock", () => {
        it("establishes the time-lock & time-lock type", () => {
            builder.timelock(2000, 0);
            expect(builder.data.timelock).toBe(2000);
            expect(builder.data.timelockType).toBe(0);
        });
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            const data = "dummy";
            builder.vendorField(data);
            expect(builder.data.vendorField).toBe(data);
        });
    });
});
