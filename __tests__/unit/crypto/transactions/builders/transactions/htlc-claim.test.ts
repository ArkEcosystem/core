import "jest-extended";

import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { HtlcClaimBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/htlc-claim";
import { HtlcClaimTransaction } from "../../../../../../packages/crypto/src/transactions/types/htlc-claim";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: HtlcClaimBuilder;

beforeEach(() => {
    builder = BuilderFactory.htlcClaim();
});

describe("Htlc claim Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.HtlcClaim);
        expect(builder).toHaveProperty("data.fee", HtlcClaimTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcClaimAsset", () => {
        it("should set the htlc claim asset", () => {
            const htlcClaimAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                unlockSecret: "my secret that should be 32bytes",
            };

            builder.htlcClaimAsset(htlcClaimAsset);

            expect(builder.data.asset.claim).toEqual(htlcClaimAsset);
        });
    });

    describe("verify", () => {
        const htlcClaimAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            unlockSecret: "my secret that should be 32bytes",
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
