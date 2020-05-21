import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { HtlcClaimBuilder } from "@packages/crypto/src/transactions/builders/transactions/htlc-claim";
import { Two } from "@packages/crypto/src/transactions/types";

import { htlcSecretHex } from "../../__fixtures__/htlc";

let crypto: CryptoManager<any>;
let builder: HtlcClaimBuilder<any, Interfaces.ITransactionData, any>;
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

    builder = transactionsManager.BuilderFactory.htlcClaim();
});

describe("Htlc claim Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcClaim);
        expect(builder).toHaveProperty("data.fee", Two.HtlcClaimTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcClaimAsset", () => {
        it("should set the htlc claim asset", () => {
            const htlcClaimAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                unlockSecret: htlcSecretHex,
            };

            builder.htlcClaimAsset(htlcClaimAsset);

            expect(builder.data.asset.claim).toEqual(htlcClaimAsset);
        });
    });

    describe("verify", () => {
        const htlcClaimAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            unlockSecret: htlcSecretHex,
        };

        it("should be valid with a signature", () => {
            const actual = builder.htlcClaimAsset(htlcClaimAsset).sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
