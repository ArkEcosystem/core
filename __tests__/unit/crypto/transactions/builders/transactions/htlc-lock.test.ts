import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { HtlcLockExpirationType, TransactionType } from "@packages/crypto/src/enums";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { HtlcLockBuilder } from "@packages/crypto/src/transactions/builders/transactions/htlc-lock";
import { Two } from "@packages/crypto/src/transactions/types";

const { EpochTimestamp } = HtlcLockExpirationType;

let builder: HtlcLockBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    configManager.setConfig(Generators.generateCryptoConfigRaw());

    builder = BuilderFactory.htlcLock();
});

describe("Htlc lock Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcLock);
        expect(builder).toHaveProperty("data.fee", Two.HtlcLockTransaction.staticFee());
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcLockAsset", () => {
        it("should set the htlc lock asset", () => {
            const htlcLockAsset = {
                secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
                expiration: {
                    type: EpochTimestamp,
                    value: Math.floor(Date.now() / 1000),
                },
            };

            builder.htlcLockAsset(htlcLockAsset);

            expect(builder.data.asset.lock).toEqual(htlcLockAsset);
        });
    });

    describe("verify", () => {
        const htlcLockAsset = {
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Math.floor(Date.now() / 1000),
            },
        };
        const address = "AVzsSFwicz5gYLqCzZNL8N1RztkWQSMovK";

        it("should be valid with a signature", () => {
            const actual = builder
                .recipientId(address)
                .htlcLockAsset(htlcLockAsset)
                .amount("1")
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .recipientId(address)
                .htlcLockAsset(htlcLockAsset)
                .amount("1")
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
