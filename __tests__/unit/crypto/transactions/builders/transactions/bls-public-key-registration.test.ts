import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { TransactionType } from "@packages/crypto/src/enums";
import { configManager } from "@packages/crypto/src/managers";
import { Utils } from "@packages/crypto/src/transactions";
import { BuilderFactory } from "@packages/crypto/src/transactions/builders";
import { BlsPublicKeyRegistrationBuilder } from "@packages/crypto/src/transactions/builders/transactions/bls-public-key-registration";
import { Two } from "@packages/crypto/src/transactions/types";
import { BigNumber } from "@packages/crypto/src/utils";

let builder: BlsPublicKeyRegistrationBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
});

describe("Bls Public Key Registration Transaction", () => {
    describe("verify", () => {
        beforeEach(() => {
            builder = BuilderFactory.blsPublicKeyRegistration();
        });

        it("should be valid with a signature", () => {
            const actual = builder
                .blsPublicKeyAsset({
                    oldBlsPublicKey: "a".repeat(96),
                    newBlsPublicKey: "b".repeat(96),
                })
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .blsPublicKeyAsset({
                    oldBlsPublicKey: "a".repeat(96),
                    newBlsPublicKey: "b".repeat(96),
                })
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        beforeEach(() => {
            builder = BuilderFactory.blsPublicKeyRegistration();
        });

        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionType.BlsPublicKeyRegistration);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", Two.BlsPublicKeyRegistrationTransaction.staticFee());
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", {});
        });
    });

    describe("blsPublicKeyAsset", () => {
        beforeEach(() => {
            builder = BuilderFactory.blsPublicKeyRegistration();
        });
        it("establishes the newBlsPublicKey and oldBlsPublicKey  of the asset", () => {
            builder.blsPublicKeyAsset({
                oldBlsPublicKey: "a".repeat(96),
                newBlsPublicKey: "b".repeat(96),
            });
            expect(builder.data.asset.blsPublicKey.oldBlsPublicKey).toBe("a".repeat(96));
            expect(builder.data.asset.blsPublicKey.newBlsPublicKey).toBe("b".repeat(96));
        });

        it("establishes the newBlsPublicKey  of the asset", () => {
            builder.blsPublicKeyAsset({
                newBlsPublicKey: "b".repeat(96),
            });
            expect(builder.data.asset.blsPublicKey.oldBlsPublicKey).toBeUndefined();
            expect(builder.data.asset.blsPublicKey.newBlsPublicKey).toBe("b".repeat(96));
        });
    });

    describe("getStruct", () => {
        beforeEach(() => {
            builder = BuilderFactory.blsPublicKeyRegistration().blsPublicKeyAsset({
                oldBlsPublicKey: "a".repeat(96),
                newBlsPublicKey: "b".repeat(96),
            });
        });

        it("should fail if the transaction is not signed", () => {
            expect(() => builder.getStruct()).toThrow(/transaction.*sign/);
        });

        describe("when is signed", () => {
            beforeEach(() => {
                configManager.getMilestone().aip11 = false;

                builder.version(1).sign("any pass");
            });

            it("returns the id", () => {
                expect(builder.getStruct().id).toBe(Utils.getId(builder.data));
            });

            it("returns the signature", () => {
                expect(builder.getStruct().signature).toBe(builder.data.signature);
            });

            it("returns the second signature", () => {
                expect(builder.getStruct().secondSignature).toBe(builder.data.secondSignature);
            });

            it("returns the timestamp", () => {
                expect(builder.getStruct().timestamp).toBe(builder.data.timestamp);
            });

            it("returns the transaction type", () => {
                expect(builder.getStruct().type).toBe(builder.data.type);
            });

            it("returns the fee", () => {
                expect(builder.getStruct().fee).toBe(builder.data.fee);
            });

            it("returns the sender public key", () => {
                expect(builder.getStruct().senderPublicKey).toBe(builder.data.senderPublicKey);
            });

            it("returns the amount", () => {
                expect(builder.getStruct().amount).toBe(builder.data.amount);
            });

            it("returns the recipient udnefined", () => {
                expect(builder.getStruct().recipientId).toBeUndefined();
            });

            it("returns the asset", () => {
                expect(builder.getStruct().asset).toBe(builder.data.asset);
            });
        });
    });
});
