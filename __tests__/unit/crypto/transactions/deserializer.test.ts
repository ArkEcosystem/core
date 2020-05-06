import "jest-extended";

import * as Generators from "@packages/core-test-framework/src/app/generators";
import { CryptoManager, Enums, Errors, Transactions } from "@packages/crypto/src";
import ByteBuffer from "bytebuffer";

import {
    InvalidTransactionBytesError,
    TransactionSchemaError,
    TransactionVersionError,
    UnkownTransactionError,
} from "../../../../packages/crypto/src/errors";
import { ITransaction } from "../../../../packages/crypto/src/interfaces";
import { htlcSecretHashHex, htlcSecretHex } from "./__fixtures__/htlc";
import { legacyMultiSignatureRegistration } from "./__fixtures__/transaction";

let Deserializer;
let Serializer;
let Verifier;
let BuilderFactory;
let TransactionFactory;
let cryptoManagerDevNet: CryptoManager<any>;
let TransactionUtils;
let Keys;
let Address;
let PublicKey;

let cryptoManagerRawConfig;
let transactionsManagerRawConfig;

beforeAll(() => {
    cryptoManagerDevNet = CryptoManager.createFromPreset("devnet");

    const transactionsManager = new Transactions.TransactionsManager(cryptoManagerDevNet, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });
    Deserializer = transactionsManager.Deserializer;
    Serializer = transactionsManager.Serializer;
    Verifier = transactionsManager.Verifier;
    BuilderFactory = transactionsManager.BuilderFactory;
    TransactionFactory = transactionsManager.TransactionFactory;
    TransactionUtils = transactionsManager.Utils;
    Address = cryptoManagerDevNet.Identities.Address;
    Keys = cryptoManagerDevNet.Identities.Keys;
    PublicKey = cryptoManagerDevNet.Identities.PublicKey;

    cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = true;

    // raw

    cryptoManagerRawConfig = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManagerRawConfig = new Transactions.TransactionsManager(cryptoManagerRawConfig, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });
});

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized: ITransaction<any, any>, expected) => {
        const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount"];
        if (deserialized.data.version === 1) {
            fieldsToCheck.push("timestamp");
        } else {
            fieldsToCheck.push("typeGroup");
            fieldsToCheck.push("nonce");
        }

        for (const field of fieldsToCheck) {
            expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
        }

        expect(Verifier.verify(deserialized.data)).toBeTrue();
    };

    describe("ser/deserialize - transfer", () => {
        let transfer;

        beforeEach(() => {
            transfer = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .vendorField("cool vendor field")
                .sign("dummy passphrase")
                .getStruct();
        });

        it("should ser/deserialize giving back original fields", () => {
            const serialized = TransactionFactory.fromData(transfer).serialized.toString("hex");
            const deserialized = Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(transfer.vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize with long vendorfield when vendorFieldLength=255 milestone is active", () => {
            cryptoManagerDevNet.MilestoneManager.getMilestone().vendorFieldLength = 255;

            const transferWithLongVendorfield = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .vendorField("y".repeat(255))
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionUtils.toBytes(transferWithLongVendorfield);
            const deserialized = TransactionFactory.fromBytes(serialized);

            expect(deserialized.verified).toBeTrue();
            expect(deserialized.data.vendorField).toHaveLength(255);
            expect(deserialized.data.vendorField).toEqual("y".repeat(255));

            cryptoManagerDevNet.MilestoneManager.getMilestone().vendorFieldLength = 64;
        });

        // TODO: this test is really testing schema validation, and so should be pulled out to validation layer...
        it.skip("should not ser/deserialize long vendorfield when vendorFieldLength=255 milestone is not active", () => {
            const transferWithLongVendorfield = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .sign("dummy passphrase")
                .getStruct();

            transferWithLongVendorfield.vendorField = "y".repeat(255);

            expect(() => {
                const serialized = TransactionUtils.toBytes(transferWithLongVendorfield);
                TransactionFactory.fromBytes(serialized);
            }).toThrow(TransactionSchemaError);
        });
    });

    describe("ser/deserialize - second signature", () => {
        it("should ser/deserialize giving back original fields", () => {
            const secondSignature = BuilderFactory.secondSignature()
                .signatureAsset("signature")
                .fee("50000000")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(secondSignature).serialized.toString("hex");
            const deserialized = Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, secondSignature);

            expect(deserialized.data.asset).toEqual(secondSignature.asset);
        });
    });

    describe("ser/deserialize - delegate registration", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateRegistration = BuilderFactory.delegateRegistration()
                .usernameAsset("homer")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(delegateRegistration).serialized.toString("hex");
            const deserialized = Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateRegistration);

            expect(deserialized.data.asset).toEqual(delegateRegistration.asset);
        });
    });

    describe("ser/deserialize - vote", () => {
        it("should ser/deserialize giving back original fields", () => {
            const vote = BuilderFactory.vote()
                .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
                .fee("50000000")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(vote).serialized.toString("hex");
            const deserialized = Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, vote);

            expect(deserialized.data.asset).toEqual(vote.asset);
        });
    });

    describe("ser/deserialize - multi signature (LEGACY)", () => {
        it.skip("should ser/deserialize a legacy multisig registration", () => {
            const deserialized = TransactionFactory.fromHex(legacyMultiSignatureRegistration.serialized);

            expect(deserialized.id).toEqual(legacyMultiSignatureRegistration.data.id);
            expect(deserialized.toJson()).toMatchObject(legacyMultiSignatureRegistration.data);
        });
    });

    describe("ser/deserialize - multi signature", () => {
        let multiSignatureRegistration;

        beforeEach(() => {
            const Keys = cryptoManagerRawConfig.Identities.Keys;

            const participant1 = Keys.fromPassphrase("secret 1");
            const participant2 = Keys.fromPassphrase("secret 2");
            const participant3 = Keys.fromPassphrase("secret 3");

            multiSignatureRegistration = transactionsManagerRawConfig.BuilderFactory.multiSignature()
                .senderPublicKey(participant1.publicKey)
                .participant(participant1.publicKey)
                .participant(participant2.publicKey)
                .participant(participant3.publicKey)
                .min(3)
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2)
                .sign("secret 1")
                .getStruct();
        });

        it("should ser/deserialize a multisig registration", () => {
            const transaction = transactionsManagerRawConfig.TransactionFactory.fromData(multiSignatureRegistration);
            const deserialized = transactionsManagerRawConfig.TransactionFactory.fromBytes(transaction.serialized);

            expect(transaction.isVerified).toBeTrue();
            expect(deserialized.isVerified).toBeTrue();
            expect(deserialized.data.asset).toEqual(multiSignatureRegistration.asset);
            expect(transaction.data.signatures).toEqual(deserialized.data.signatures);
            checkCommonFields(deserialized, multiSignatureRegistration);
        });

        it("should fail to verify", () => {
            const transaction = transactionsManagerRawConfig.TransactionFactory.fromData(multiSignatureRegistration);
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            expect(transaction.verify()).toBeFalse();
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            expect(transaction.verify()).toBeTrue();
        });

        it("should not deserialize a malformed signature", () => {
            const transaction = transactionsManagerRawConfig.TransactionFactory.fromData(multiSignatureRegistration);
            transaction.serialized = transaction.serialized.slice(0, transaction.serialized.length - 2);

            expect(() =>
                transactionsManagerRawConfig.TransactionFactory.fromBytes(transaction.serialized),
            ).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe("ser/deserialize - ipfs", () => {
        let ipfsTransaction;

        const ipfsIds = [
            "QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w",
            "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
            "QmQeUqdjFmaxuJewStqCLUoKrR9khqb4Edw9TfRQQdfWz3",
            "Qma98bk1hjiRZDTmYmfiUXDj8hXXt7uGA5roU5mfUb3sVG",
        ];

        beforeEach(() => {
            ipfsTransaction = transactionsManagerRawConfig.BuilderFactory.ipfs()
                .fee("50000000")
                .version(2)
                .ipfsAsset(ipfsIds[0])
                .sign("dummy passphrase")
                .getStruct();
        });

        it("should ser/deserialize giving back original fields", () => {
            const serialized = transactionsManagerRawConfig.TransactionFactory.fromData(
                ipfsTransaction,
            ).serialized.toString("hex");
            const deserialized = transactionsManagerRawConfig.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, ipfsTransaction);

            expect(deserialized.data.asset).toEqual(ipfsTransaction.asset);
        });

        it("should fail to verify", () => {
            const transaction = transactionsManagerRawConfig.TransactionFactory.fromData(ipfsTransaction);
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            expect(transaction.verify()).toBeFalse();
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - delegate resignation", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateResignation = BuilderFactory.delegateResignation()
                .fee("50000000")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(delegateResignation).serialized.toString("hex");
            const deserialized = Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateResignation);
        });

        it("should fail to verify", () => {
            const delegateResignation = BuilderFactory.delegateResignation()
                .fee("50000000")
                .sign("dummy passphrase")
                .build();

            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = false;
            expect(delegateResignation.verify()).toBeFalse();
            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = true;
            expect(delegateResignation.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - multi payment", () => {
        it("should ser/deserialize giving back original fields", () => {
            const multiPayment = transactionsManagerRawConfig.BuilderFactory.multiPayment()
                .fee("50000000")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                .vendorField("Multipayment")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = transactionsManagerRawConfig.TransactionFactory.fromData(
                multiPayment,
            ).serialized.toString("hex");
            const deserialized = transactionsManagerRawConfig.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiPayment);
        });

        it("should fail to verify", () => {
            const multiPayment = transactionsManagerRawConfig.BuilderFactory.multiPayment()
                .fee("50000000")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                .sign("dummy passphrase")
                .build();

            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            expect(multiPayment.verify()).toBeFalse();
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            expect(multiPayment.verify()).toBeTrue();
        });

        it("should fail if more than hardcoded maximum of payments", () => {
            const multiPayment = transactionsManagerRawConfig.BuilderFactory.multiPayment().fee("50000000");

            for (let i = 0; i < cryptoManagerRawConfig.MilestoneManager.getMilestone().multiPaymentLimit; i++) {
                multiPayment.addPayment(
                    cryptoManagerRawConfig.Identities.Address.fromPassphrase(`recipient-${i}`),
                    "1",
                );
            }

            expect(() =>
                multiPayment.addPayment(cryptoManagerRawConfig.Identities.Address.fromPassphrase("recipientBad"), "1"),
            ).toThrow(Errors.MaximumPaymentCountExceededError);

            const transaction = multiPayment.sign("dummy passphrase").build();
            expect(transaction.verify()).toBeTrue();
            expect(
                transactionsManagerRawConfig.TransactionFactory.fromBytes(transaction.serialized, true).verify(),
            ).toBeTrue();
        });

        it("should fail if recipient on different network", () => {
            expect(() =>
                transactionsManagerRawConfig.BuilderFactory.multiPayment()
                    .fee("50000000")
                    .addPayment("DBzGiUk8UVjB2dKCfGRixknB7Ki3Zhqthp", "1555")
                    .addPayment("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", "1555")
                    .sign("dummy passphrase")
                    .build(),
            ).toThrow(InvalidTransactionBytesError);
        });
    });

    describe("ser/deserialize - htlc lock", () => {
        const htlcLockAsset = {
            secretHash: htlcSecretHashHex,
            expiration: {
                type: Enums.HtlcLockExpirationType.EpochTimestamp,
                value: Math.floor(Date.now() / 1000),
            },
        };

        it("should ser/deserialize giving back original fields", () => {
            const htlcLock = transactionsManagerRawConfig.BuilderFactory.htlcLock()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .vendorField("HTLC")
                .htlcLockAsset(htlcLockAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = transactionsManagerRawConfig.TransactionFactory.fromData(htlcLock).serialized.toString(
                "hex",
            );
            const deserialized = transactionsManagerRawConfig.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcLock);

            expect(deserialized.data.asset).toEqual(htlcLock.asset);
        });

        it("should fail to verify", () => {
            const htlcLock = transactionsManagerRawConfig.BuilderFactory.htlcLock()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .htlcLockAsset(htlcLockAsset)
                .sign("dummy passphrase")
                .build();

            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            expect(htlcLock.verify()).toBeFalse();
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            expect(htlcLock.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - htlc claim", () => {
        const htlcClaimAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            unlockSecret: htlcSecretHex,
        };

        it("should ser/deserialize giving back original fields", () => {
            const htlcClaim = transactionsManagerRawConfig.BuilderFactory.htlcClaim()
                .fee("0")
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = transactionsManagerRawConfig.TransactionFactory.fromData(htlcClaim).serialized.toString(
                "hex",
            );
            const deserialized = transactionsManagerRawConfig.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcClaim);

            expect(deserialized.data.asset).toEqual(htlcClaim.asset);
        });

        it("should fail to verify", () => {
            const htlcClaim = transactionsManagerRawConfig.BuilderFactory.htlcClaim()
                .fee("0")
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .build();

            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            expect(htlcClaim.verify()).toBeFalse();
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            expect(htlcClaim.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - htlc refund", () => {
        const htlcRefundAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        };

        it("should ser/deserialize giving back original fields", () => {
            const htlcRefund = transactionsManagerRawConfig.BuilderFactory.htlcRefund()
                .fee("0")
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = transactionsManagerRawConfig.TransactionFactory.fromData(htlcRefund).serialized.toString(
                "hex",
            );
            const deserialized = transactionsManagerRawConfig.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcRefund);

            expect(deserialized.data.asset).toEqual(htlcRefund.asset);
        });

        it("should fail to verify", () => {
            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = false;
            const htlcRefund1 = transactionsManagerRawConfig.BuilderFactory.htlcRefund()
                .fee("0")
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .build();

            expect(htlcRefund1.verify()).toBeFalse();

            cryptoManagerRawConfig.MilestoneManager.getMilestone().aip11 = true;
            const htlcRefund2 = transactionsManagerRawConfig.BuilderFactory.htlcRefund()
                .fee("0")
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .build();
            expect(htlcRefund2.verify()).toBeTrue();
        });
    });

    describe("deserialize - others", () => {
        it("should throw if type is not supported", () => {
            const serializeWrongType = (transaction) => {
                // copy-paste from transaction serializer, common stuff
                const buffer = new ByteBuffer(512, true);
                buffer.writeByte(0xff);
                buffer.writeByte(2);
                buffer.writeUint32(Enums.TransactionTypeGroup.Core);
                buffer.writeUint16(transaction.type);
                buffer.writeUint64(transaction.nonce.toFixed());
                buffer.append(transaction.senderPublicKey, "hex");
                buffer.writeUint64(
                    cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(transaction.fee).toFixed(),
                );
                buffer.writeByte(0x00);

                return Buffer.from(buffer.flip().toBuffer());
            };
            const transactionWrongType = transactionsManagerRawConfig.BuilderFactory.transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            const serialized = serializeWrongType(transactionWrongType).toString("hex");
            expect(() => transactionsManagerRawConfig.Deserializer.deserialize(serialized)).toThrow(
                UnkownTransactionError,
            );
        });
    });

    describe("deserialize Schnorr / ECDSA", () => {
        let builderWith;

        beforeAll(() => {
            builderWith = (hasher: string, hasher2?: string) => {
                const keys = Keys.fromPassphrase("secret");

                const builder = BuilderFactory.transfer()
                    .senderPublicKey(keys.publicKey)
                    .recipientId(Address.fromPublicKey(keys.publicKey))
                    .amount("10000")
                    .fee("50000000");

                const buffer = TransactionUtils.toHash(builder.data, {
                    excludeSignature: true,
                    excludeSecondSignature: true,
                });

                builder.data.signature = cryptoManagerRawConfig.LibraryManager.Crypto.Hash[hasher](buffer, keys);

                if (hasher2) {
                    const keys = Keys.fromPassphrase("secret 2");
                    const buffer = TransactionUtils.toHash(builder.data, {
                        excludeSecondSignature: true,
                    });

                    builder.data.secondSignature = cryptoManagerRawConfig.LibraryManager.Crypto.Hash[hasher2](
                        buffer,
                        keys,
                    );
                }

                return builder;
            };
        });

        it("should deserialize a V2 transaction signed with Schnorr", () => {
            const builder = builderWith("signSchnorr");

            let transaction: ITransaction<any, any>;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();
            expect(transaction.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction signed with ECDSA", () => {
            const builder = builderWith("signECDSA");

            let transaction: ITransaction<any, any>;
            expect(builder.data.version).toBe(2);
            expect(builder.data.signature).not.toHaveLength(64);
            expect(() => (transaction = builder.build())).not.toThrow();
            expect(transaction.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction when signed with Schnorr/Schnorr", () => {
            const builder = builderWith("signSchnorr", "signSchnorr");

            let transaction: ITransaction<any, any>;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();

            expect(transaction.verify()).toBeTrue();
            expect(Verifier.verifySecondSignature(transaction.data, PublicKey.fromPassphrase("secret 2"))).toBeTrue();
            expect(Verifier.verifySecondSignature(transaction.data, PublicKey.fromPassphrase("secret 3"))).toBeFalse();
        });

        it("should throw when V2 transaction is signed with Schnorr and ECDSA", () => {
            let builder = builderWith("signSchnorr", "signECDSA");
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            builder = builderWith("signECDSA", "signSchnorr");
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();
        });

        it("should throw when V2 transaction is signed with Schnorr and AIP11 not active", () => {
            const builder = builderWith("signSchnorr");

            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = false;
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = true;
        });

        it("should throw when V1 transaction is signed with Schnorr", () => {
            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = false;

            const builder = builderWith("signSchnorr");
            const buffer = TransactionUtils.toHash(builder.data, {
                excludeSignature: true,
                excludeSecondSignature: true,
            });

            builder.data.signature = builder.data.signature = cryptoManagerRawConfig.LibraryManager.Crypto.Hash.signSchnorr(
                buffer,
                Keys.fromPassphrase("secret"),
            );

            expect(builder.data.version).toBe(1);
            expect(() => builder.build()).toThrow();

            cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = true;
        });
    });

    describe("serialize - others", () => {
        it("should throw if type is not supported", () => {
            const transactionWrongType = BuilderFactory.transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            expect(() => TransactionFactory.fromData(transactionWrongType)).toThrow(UnkownTransactionError);
        });
    });

    describe("getBytesV1", () => {
        beforeAll(() => (cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = false));
        afterAll(() => (cryptoManagerDevNet.MilestoneManager.getMilestone().aip11 = true));
        let bytes;

        // it('should return Buffer of simply transaction and buffer must be 292 length', () => {
        //   const transaction = {
        //     type: 0,
        //     amount: 1000,
        //     fee: 2000,
        //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        //     timestamp: 141738,
        //     asset: {},
        //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        //   }

        //   bytes = crypto.getBytes(transaction)
        //   expect(bytes).toBeObject()
        //   expect(bytes.toString('hex') + transaction.signature).toHaveLength(292)
        // })

        it("should return Buffer of simply transaction and buffer must be 202 length", () => {
            const transaction = {
                type: 0,
                amount: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(1000),
                fee: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            bytes = Serializer.getBytes(transaction);
            expect(bytes).toBeObject();
            expect(bytes.length).toBe(202);
            expect(bytes.toString("hex")).toBe(
                "00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
            );
        });

        // it('should return Buffer of transaction with second signature and buffer must be 420 length', () => {
        //   const transaction = {
        //     type: 0,
        //     amount: 1000,
        //     fee: 2000,
        //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        //     timestamp: 141738,
        //     asset: {},
        //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
        //     secondSignature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        //   }

        //   bytes = crypto.getBytes(transaction)
        //   expect(bytes).toBeObject()
        //   expect(bytes.toString('hex') + transaction.signature + transaction.secondSignature).toHaveLength(420)
        // })

        it("should return Buffer of transaction with second signature and buffer must be 266 length", () => {
            const transaction = {
                version: 1,
                type: 0,
                amount: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(1000),
                fee: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                secondSignature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            bytes = Serializer.getBytes(transaction);
            expect(bytes).toBeObject();
            expect(bytes.length).toBe(266);
            expect(bytes.toString("hex")).toBe(
                "00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
            );
        });

        it("should throw for unsupported version", () => {
            const transaction = {
                version: 110,
                type: 0,
                amount: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(1000),
                fee: cryptoManagerRawConfig.LibraryManager.Libraries.BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                secondSignature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            expect(() => Serializer.getBytes(transaction)).toThrow(TransactionVersionError);
        });
    });
});
