import "jest-extended";
import { MultiPaymentBuilder } from "../../../src/builder/transactions/multi-payment";
import { client } from "../../../src/client";
import { TransactionTypes } from "../../../src/constants";
import { MaximumPaymentCountExceededError } from "../../../src/errors";
import { feeManager } from "../../../src/managers/fee";
import { Bignum } from "../../../src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: MultiPaymentBuilder;

beforeEach(() => {
    builder = client.getBuilder().multiPayment();
});

describe("Multi Payment Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.MultiPayment);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.MultiPayment));
        expect(builder).toHaveProperty("data.asset.payments", []);
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
            builder.addPayment("address", 1);
            builder.addPayment("address", 2);
            builder.addPayment("address", 3);

            expect(builder.data.asset.payments).toEqual([
                {
                    amount: new Bignum(1),
                    recipientId: "address",
                },
                {
                    amount: new Bignum(2),
                    recipientId: "address",
                },
                {
                    amount: new Bignum(3),
                    recipientId: "address",
                },
            ]);
        });

        it("should throw if we want to add more payments than max authorized", () => {
            builder.data.asset.payments = new Array(2258);

            expect(() => builder.addPayment("address", 2)).toThrow(MaximumPaymentCountExceededError);
        });
    });
});
