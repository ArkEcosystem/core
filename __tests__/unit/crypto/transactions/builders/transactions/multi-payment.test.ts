import "jest-extended";

import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { MaximumPaymentCountExceededError } from "../../../../../../packages/crypto/src/errors";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { MultiPaymentBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/multi-payment";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: MultiPaymentBuilder;

beforeEach(() => {
    builder = BuilderFactory.multiPayment();
});

describe("Multi Payment Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.MultiPayment);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.MultiPayment));
        expect(builder).toHaveProperty("data.asset.payments", []);
        expect(builder).toHaveProperty("data.vendorFieldHex", undefined);
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
            builder.addPayment("address", "1");
            builder.addPayment("address", "2");
            builder.addPayment("address", "3");

            expect(builder.data.asset.payments).toEqual([
                {
                    amount: BigNumber.ONE,
                    recipientId: "address",
                },
                {
                    amount: BigNumber.make(2),
                    recipientId: "address",
                },
                {
                    amount: BigNumber.make(3),
                    recipientId: "address",
                },
            ]);
        });

        it("should throw if we want to add more payments than max authorized", () => {
            builder.data.asset.payments = new Array(2258);

            expect(() => builder.addPayment("address", "2")).toThrow(MaximumPaymentCountExceededError);
        });
    });
});
