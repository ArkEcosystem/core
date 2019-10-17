import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { HtlcRefundBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/htlc-refund";
import { HtlcRefundTransaction } from "../../../../../../packages/crypto/src/transactions/types/htlc-refund";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: HtlcRefundBuilder;

beforeEach(() => {
    configManager.setFromPreset("unitnet");

    builder = BuilderFactory.htlcRefund();
});

describe("Htlc refund Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcRefund);
        expect(builder).toHaveProperty("data.fee", HtlcRefundTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcRefundAsset", () => {
        it("should set the htlc refund asset", () => {
            const htlcRefundAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            };

            builder.htlcRefundAsset(htlcRefundAsset);

            expect(builder.data.asset.refund).toEqual(htlcRefundAsset);
        });
    });

    describe("verify", () => {
        const htlcRefundAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        };

        it("should be valid with a signature", () => {
            const actual = builder.htlcRefundAsset(htlcRefundAsset).sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
