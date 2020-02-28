import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { TransactionType } from "@packages/crypto/src/enums";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { HtlcClaimBuilder } from "@packages/crypto/src/transactions/builders/transactions/htlc-claim";
import { Two } from "@packages/crypto/src/transactions/types";
import { BigNumber } from "@packages/crypto/src/utils";

import { htlcSecretHex } from "../../__fixtures__/htlc";

let builder: HtlcClaimBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    configManager.setConfig(Generators.generateCryptoConfigRaw());

    builder = BuilderFactory.htlcClaim();
});

describe("Htlc claim Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcClaim);
        expect(builder).toHaveProperty("data.fee", Two.HtlcClaimTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
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
