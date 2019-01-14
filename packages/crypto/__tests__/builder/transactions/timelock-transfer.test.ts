import "jest-extended";
import { TimelockTransferBuilder } from "../../../dist/builder";
import { client as ark } from "../../../dist/client";
import { TransactionTypes } from "../../../dist/constants";
import { feeManager } from "../../../dist/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder : TimelockTransferBuilder;

beforeEach(() => {
    builder = ark.getBuilder().timelockTransfer();
});

describe("Timelock Transfer Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.TimelockTransfer);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.TimelockTransfer));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.timelockType", 0x00);
        expect(builder).toHaveProperty("data.timelock", null);
    });

    describe("timelock", () => {
        it("establishes the time-lock & time-lock type", () => {
            builder.timelock("time lock", "time lock type");
            expect(builder.data.timelock).toBe("time lock");
            expect(builder.data.timelockType).toBe("time lock type");
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
