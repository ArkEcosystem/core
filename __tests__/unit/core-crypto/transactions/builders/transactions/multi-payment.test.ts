import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { TransactionType } from "@packages/crypto/src/enums";
import { MaximumPaymentCountExceededError } from "@packages/crypto/src/errors";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { MultiPaymentBuilder } from "@packages/crypto/src/transactions/builders/transactions/multi-payment";
import { Two } from "@packages/crypto/src/transactions/types";
import { BigNumber } from "@packages/crypto/src/utils";

let builder: MultiPaymentBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);

    builder = BuilderFactory.multiPayment();
});

describe("Multi Payment Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.MultiPayment);
        expect(builder).toHaveProperty("data.fee", Two.MultiPaymentTransaction.staticFee());
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
            builder.data.asset.payments = new Array(500);

            expect(() => builder.addPayment("address", "2")).toThrow(MaximumPaymentCountExceededError);
        });
    });
});
