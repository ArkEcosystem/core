import "jest-extended";
import { MultiPaymentBuilder } from "../../../dist/builder";
import { client as ark } from "../../../dist/client";
import { TransactionTypes } from "../../../dist/constants";
import { feeManager } from "../../../dist/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: MultiPaymentBuilder;

beforeEach(() => {
    builder = ark.getBuilder().multiPayment();
});

describe("Multi Payment Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.MultiPayment);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.MultiPayment));
        expect(builder).toHaveProperty("data.payments", {});
        expect(builder).toHaveProperty("data.vendorFieldHex", null);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            const data = "dummy";
            builder.vendorField(data);
            expect(builder.data.vendorField).toBe(data);
        });
    });

    describe("addPayment", () => {
        it("should add new payments", () => {
            builder.addPayment("address", "amount");
            builder.addPayment("address", "amount");
            builder.addPayment("address", "amount");

            expect(builder.data.payments).toEqual({
                address1: "address",
                address2: "address",
                address3: "address",
                amount1: "amount",
                amount2: "amount",
                amount3: "amount",
            });
        });
    });
});
