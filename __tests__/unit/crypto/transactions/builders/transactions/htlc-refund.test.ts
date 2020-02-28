import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { TransactionType } from "@packages/crypto/src/enums";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { HtlcRefundBuilder } from "@packages/crypto/src/transactions/builders/transactions/htlc-refund";
import { Two } from "@packages/crypto/src/transactions/types";
import { BigNumber } from "@packages/crypto/src/utils";

let builder: HtlcRefundBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    configManager.setConfig(Generators.generateCryptoConfigRaw());

    builder = BuilderFactory.htlcRefund();
});

describe("Htlc refund Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcRefund);
        expect(builder).toHaveProperty("data.fee", Two.HtlcRefundTransaction.staticFee());
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
