import "jest-extended";

import { CryptoManager, Errors, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { MultiPaymentBuilder } from "@packages/crypto/src/transactions/builders/transactions/multi-payment";
import { Two } from "@packages/crypto/src/transactions/types";

let crypto: CryptoManager<any>;
let builder: MultiPaymentBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionManager<any, Interfaces.ITransactionData, any>;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());
    crypto.HeightTracker.setHeight(2);

    transactionsManager = new Transactions.TransactionManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.multiPayment();
});

describe("Multi Payment Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.MultiPayment);
        expect(builder).toHaveProperty("data.fee", Two.MultiPaymentTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.asset.payments", []);
        expect(builder).toHaveProperty("data.vendorField", undefined);
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
                    amount: crypto.LibraryManager.Libraries.BigNumber.ONE,
                    recipientId: "address",
                },
                {
                    amount: crypto.LibraryManager.Libraries.BigNumber.make(2),
                    recipientId: "address",
                },
                {
                    amount: crypto.LibraryManager.Libraries.BigNumber.make(3),
                    recipientId: "address",
                },
            ]);
        });

        it("should throw if we want to add more payments than max authorized", () => {
            builder.data.asset.payments = new Array(500);

            expect(() => builder.addPayment("address", "2")).toThrow(Errors.MaximumPaymentCountExceededError);
        });
    });
});
