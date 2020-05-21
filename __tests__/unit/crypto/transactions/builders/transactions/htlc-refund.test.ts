import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { HtlcRefundBuilder } from "@packages/crypto/src/transactions/builders/transactions/htlc-refund";
import { Two } from "@packages/crypto/src/transactions/types";

let crypto: CryptoManager<any>;
let builder: HtlcRefundBuilder<any, Interfaces.ITransactionData, any>;
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

    builder = transactionsManager.BuilderFactory.htlcRefund();
});

describe("Htlc refund Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcRefund);
        expect(builder).toHaveProperty("data.fee", Two.HtlcRefundTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
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
