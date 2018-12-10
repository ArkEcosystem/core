import "jest-extended";
import { client as ark } from "../../../src/client";
import { TRANSACTION_TYPES } from "../../../src/constants";
import { feeManager } from "../../../src/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder;

beforeEach(() => {
    builder = ark.getBuilder().timelockTransfer();

    // @ts-ignore
    global.builder = builder;
});

describe("Timelock Transfer Transaction", () => {
    transactionBuilder();

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TRANSACTION_TYPES.TIMELOCK_TRANSFER);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.timelockType", 0x00);
        expect(builder).toHaveProperty("data.timelock", null);
    });

    describe("timelock", () => {
        it("establishes the time lock", () => {
            builder.timelock("time lock");
            expect(builder.data.timelock).toBe("time lock");
        });

        it("establishes the time lock type", () => {
            builder.timelock(null, "time lock type");
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
