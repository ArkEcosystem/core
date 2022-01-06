import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { Enums, Errors, Utils } from "@packages/crypto/src";
import { Hash } from "@packages/crypto/src/crypto";
import {
    InvalidTransactionBytesError,
    TransactionSchemaError,
    TransactionVersionError,
    UnkownTransactionError,
} from "@packages/crypto/src/errors";
import { Address, Keys, PublicKey } from "@packages/crypto/src/identities";
import { IKeyPair, ITransaction, ITransactionData } from "@packages/crypto/src/interfaces";
import { configManager } from "@packages/crypto/src/managers";
import { TransactionFactory, Utils as TransactionUtils, Verifier } from "@packages/crypto/src/transactions";
import { BuilderFactory } from "@packages/crypto/src/transactions/builders";
import { Deserializer } from "@packages/crypto/src/transactions/deserializer";
import { Serializer } from "@packages/crypto/src/transactions/serializer";
import ByteBuffer from "bytebuffer";

import { htlcSecretHashHex, htlcSecretHex } from "./__fixtures__/htlc";
import { legacyMultiSignatureRegistration } from "./__fixtures__/transaction";

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized: ITransaction, expected) => {
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

    describe("Version 1", () => {
        beforeEach(() => {
            configManager.getMilestone().aip11 = false;
        });

        describe("ser/deserialize - transfer", () => {
            const transfer = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .timestamp(148354645)
                .vendorField("cool vendor field")
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            it("should ser/deserialize giving back original fields", () => {
                const serialized = TransactionFactory.fromData(transfer).serialized.toString("hex");
                expect(serialized).toEqual(
                    "ff011e0055b6d70802a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08780f0fa020000000011636f6f6c2076656e646f72206669656c641027000000000000000000001e07917aa042bf600339e13ed57c5364a71eebb8c33044022013287e3d1713e1a407068af0054412dc523476a8786823b8744d2ba8a3daa144022059f30896ad610aecb145275bd89de58ddaeb7c703d31fdab2a02efa3ea4ae1bd",
                );

                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, transfer);

                expect(deserialized.data.vendorField).toBe(transfer.vendorField);
                expect(deserialized.data.recipientId).toBe(transfer.recipientId);
            });

            it("should ser/deserialize with long vendorfield when vendorFieldLength=255 milestone is active", () => {
                configManager.getMilestone().vendorFieldLength = 255;

                const transferWithLongVendorfield = BuilderFactory.transfer()
                    .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                    .amount("10000")
                    .fee("50000000")
                    .timestamp(148354645)
                    .vendorField("y".repeat(255))
                    .network(30)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionUtils.toBytes(transferWithLongVendorfield);
                expect(serialized.toString("hex")).toEqual(
                    "ff011e0055b6d70802a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08780f0fa0200000000ff7979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979797979791027000000000000000000001e07917aa042bf600339e13ed57c5364a71eebb8c330450221008c7278bf5a3a0f79afade499f3c2c574a54d936708e078408030e222fb4aaea102203559198c9b99a4fe679e40c48c8d25390e5bdf42ec2aafe6a2c85ab637e34748",
                );
                const deserialized = TransactionFactory.fromBytes(serialized);

                expect(deserialized.verified).toBeTrue();
                expect(deserialized.data.vendorField).toHaveLength(255);
                expect(deserialized.data.vendorField).toEqual("y".repeat(255));

                configManager.getMilestone().vendorFieldLength = 64;
            });

            it("should not ser/deserialize long vendorfield when vendorFieldLength=255 milestone is not active", () => {
                const transferWithLongVendorfield = BuilderFactory.transfer()
                    .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                    .amount("10000")
                    .fee("50000000")
                    .network(30)
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
                    .timestamp(148354645)
                    .network(30)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(secondSignature).serialized.toString("hex");
                expect(serialized).toEqual(
                    "ff011e0155b6d70802a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08780f0fa02000000000002314387e7f065bc95bb23197b39179f6fb8b9a23771e228a65326604f2c9860a13044022066b9d53702e38f2cf416fed043d30da6fa1adc140d144bfd563ba0be48f2de16022007c82133bc9c23a81390c4ed2237865a57c662bd536e5f1fcab2a3ae14f06287",
                );
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, secondSignature);

                expect(deserialized.data.asset).toEqual(secondSignature.asset);
            });
        });

        describe("ser/deserialize - delegate registration", () => {
            it("should ser/deserialize giving back original fields", () => {
                const delegateRegistration = BuilderFactory.delegateRegistration()
                    .usernameAsset("homer")
                    .timestamp(148354645)
                    .network(30)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(delegateRegistration).serialized.toString("hex");
                expect(serialized).toEqual(
                    "ff011e0255b6d70802a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08700f90295000000000005686f6d6572304402207752a833bd57722134a07796a44eb2a132e37a873e6fdb51c1bf217116f6293d02204ee141716b142e49e62488ee9c97458a38942177a7ef8f7737b702c896245655",
                );
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, delegateRegistration);

                expect(deserialized.data.asset).toEqual(delegateRegistration.asset);
            });
        });

        describe("ser/deserialize - vote", () => {
            it("should ser/deserialize giving back original fields", () => {
                const vote = BuilderFactory.vote()
                    .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
                    .timestamp(148354645)
                    .fee("50000000")
                    .network(30)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(vote).serialized.toString("hex");
                expect(serialized).toEqual(
                    "ff011e0355b6d70802a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08780f0fa020000000000010102bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c93045022100b80680e9368e830663c10e52ab69b4adbbf4d55b9701a301cec5849640109fb102202c42de6a55792a16c8394d0981a852b0dea314b14378cdd3b4026e6b2e840074",
                );
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
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());

                const participant1 = Keys.fromPassphrase("secret 1");
                const participant2 = Keys.fromPassphrase("secret 2");
                const participant3 = Keys.fromPassphrase("secret 3");

                multiSignatureRegistration = BuilderFactory.multiSignature()
                    .senderPublicKey(participant1.publicKey)
                    .network(23)
                    .timestamp(148354645)
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
                const transaction = TransactionFactory.fromData(multiSignatureRegistration);
                expect(transaction.serialized.toString("hex")).toEqual(
                    "ff02170100000004000000000000000000039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f220094357700000000000303039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd5e3b61f2d6a2589b9abb4ed1dfd7253a1d2ac586d383a8a17237928d4648cd6d3ff1c8b025c7e150282f73ecd8a13f86254b508940ebb23d4f6f4f473b3a15de007dbeace4f00c9d5961a6bd65b4dbc6ea2b4c6278adc351e6da9eeba69478a7784e17754eff20a3ccd68cd48d87847d40768785852594e73cc6b01105064b6b5701d1c435978899abafd485f5e2dfe737781368efc1c4d02f4009a650849a434b923b2e6b79164181df493c9a05e2e6664c2ac0059d9194c792c1b1a85695b6215e0286b1d2b6abf7ca5090c66598e898aa08ba2de90dbd2ae9fe728b8b2d29504c6ad5a96ca1f0365e0390d0cf508550ded10a5e111db5bbf2b0f87972215ee69f9f",
                );
                const deserialized = TransactionFactory.fromBytes(transaction.serialized);

                expect(transaction.isVerified).toBeTrue();
                expect(deserialized.isVerified).toBeTrue();
                expect(deserialized.data.asset).toEqual(multiSignatureRegistration.asset);
                expect(transaction.data.signatures).toEqual(deserialized.data.signatures);
                checkCommonFields(deserialized, multiSignatureRegistration);
            });

            it("should fail to verify", () => {
                const transaction = TransactionFactory.fromData(multiSignatureRegistration);
                configManager.getMilestone().aip11 = false;
                expect(transaction.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(transaction.verify()).toBeTrue();
            });

            it("should not deserialize a malformed signature", () => {
                const transaction = TransactionFactory.fromData(multiSignatureRegistration);
                transaction.serialized = transaction.serialized.slice(0, transaction.serialized.length - 2);

                expect(() => TransactionFactory.fromBytes(transaction.serialized)).toThrowError(
                    InvalidTransactionBytesError,
                );
            });
        });
    });

    describe("Version 2", () => {
        beforeEach(() => {
            configManager.getMilestone().aip11 = true;
        });

        describe("ser/deserialize - ipfs", () => {
            let ipfsTransaction;

            const ipfsIds = [
                "QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w",
                "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
                "QmQeUqdjFmaxuJewStqCLUoKrR9khqb4Edw9TfRQQdfWz3",
                "Qma98bk1hjiRZDTmYmfiUXDj8hXXt7uGA5roU5mfUb3sVG",
            ];

            beforeAll(() => {
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            beforeEach(() => {
                ipfsTransaction = BuilderFactory.ipfs()
                    .fee("50000000")
                    .version(2)
                    .network(23)
                    .timestamp(148354645)
                    .ipfsAsset(ipfsIds[0])
                    .sign("dummy passphrase")
                    .getStruct();
            });

            it("should ser/deserialize giving back original fields", () => {
                const serialized = TransactionFactory.fromData(ipfsTransaction).serialized.toString("hex");
                expect(serialized).toEqual(
                    "ff0217010000000500000000000000000002a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a08780f0fa02000000000012202853f0f11ab91d73b73a2a86606103f45dd469ad2e89ec6f9a25febe8758d3fed28df5c7334e86d67074330c8e4418c47ca82a6aff823431c9690213b6983dd82569730fb267ad96750a5249b7f751d2beb3b0958ed48b0517223531d80eaf89",
                );
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, ipfsTransaction);

                expect(deserialized.data.asset).toEqual(ipfsTransaction.asset);
            });

            it("should fail to verify", () => {
                const transaction = TransactionFactory.fromData(ipfsTransaction);
                configManager.getMilestone().aip11 = false;
                expect(transaction.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(transaction.verify()).toBeTrue();
            });
        });

        describe("ser/deserialize - delegate resignation", () => {
            it("should ser/deserialize giving back original fields", () => {
                const delegateResignation = BuilderFactory.delegateResignation()
                    .fee("50000000")
                    .network(23)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(delegateResignation).serialized.toString("hex");
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, delegateResignation);
            });

            it("should fail to verify", () => {
                const delegateResignation = BuilderFactory.delegateResignation()
                    .fee("50000000")
                    .network(23)
                    .sign("dummy passphrase")
                    .build();

                configManager.getMilestone().aip11 = false;
                expect(delegateResignation.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(delegateResignation.verify()).toBeTrue();
            });
        });

        describe("ser/deserialize - multi payment", () => {
            beforeAll(() => {
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            it("should ser/deserialize giving back original fields", () => {
                const multiPayment = BuilderFactory.multiPayment()
                    .fee("50000000")
                    .network(23)
                    .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                    .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                    .vendorField("Multipayment")
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(multiPayment).serialized.toString("hex");
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, multiPayment);
            });

            it("should fail to verify", () => {
                const multiPayment = BuilderFactory.multiPayment()
                    .fee("50000000")
                    .network(23)
                    .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                    .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                    .sign("dummy passphrase")
                    .build();

                configManager.getMilestone().aip11 = false;
                expect(multiPayment.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(multiPayment.verify()).toBeTrue();
            });

            it("should fail if more than hardcoded maximum of payments", () => {
                const multiPayment = BuilderFactory.multiPayment().fee("50000000").network(23);

                for (let i = 0; i < configManager.getMilestone().multiPaymentLimit; i++) {
                    multiPayment.addPayment(Address.fromPassphrase(`recipient-${i}`), "1");
                }

                expect(() => multiPayment.addPayment(Address.fromPassphrase("recipientBad"), "1")).toThrow(
                    Errors.MaximumPaymentCountExceededError,
                );

                const transaction = multiPayment.sign("dummy passphrase").build();
                expect(transaction.verify()).toBeTrue();
                expect(TransactionFactory.fromBytes(transaction.serialized, true).verify()).toBeTrue();
            });

            it("should fail if recipient on different network", () => {
                expect(() =>
                    BuilderFactory.multiPayment()
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

            beforeAll(() => {
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            it("should ser/deserialize giving back original fields", () => {
                const htlcLock = BuilderFactory.htlcLock()
                    .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                    .amount("10000")
                    .fee("50000000")
                    .network(23)
                    .vendorField("HTLC")
                    .htlcLockAsset(htlcLockAsset)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(htlcLock).serialized.toString("hex");
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, htlcLock);

                expect(deserialized.data.asset).toEqual(htlcLock.asset);
            });

            it("should fail to verify", () => {
                const htlcLock = BuilderFactory.htlcLock()
                    .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                    .amount("10000")
                    .fee("50000000")
                    .network(23)
                    .htlcLockAsset(htlcLockAsset)
                    .sign("dummy passphrase")
                    .build();

                configManager.getMilestone().aip11 = false;
                expect(htlcLock.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(htlcLock.verify()).toBeTrue();
            });
        });

        describe("ser/deserialize - htlc claim", () => {
            const htlcClaimAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                unlockSecret: htlcSecretHex,
            };

            beforeAll(() => {
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            it("should ser/deserialize giving back original fields", () => {
                const htlcClaim = BuilderFactory.htlcClaim()
                    .fee("0")
                    .network(23)
                    .htlcClaimAsset(htlcClaimAsset)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(htlcClaim).serialized.toString("hex");
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, htlcClaim);

                expect(deserialized.data.asset).toEqual(htlcClaim.asset);
            });

            it("should fail to verify", () => {
                const htlcClaim = BuilderFactory.htlcClaim()
                    .fee("0")
                    .network(23)
                    .htlcClaimAsset(htlcClaimAsset)
                    .sign("dummy passphrase")
                    .build();

                configManager.getMilestone().aip11 = false;
                expect(htlcClaim.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(htlcClaim.verify()).toBeTrue();
            });
        });

        describe("ser/deserialize - htlc refund", () => {
            const htlcRefundAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            };

            beforeAll(() => {
                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            it("should ser/deserialize giving back original fields", () => {
                const htlcRefund = BuilderFactory.htlcRefund()
                    .fee("0")
                    .network(23)
                    .htlcRefundAsset(htlcRefundAsset)
                    .sign("dummy passphrase")
                    .getStruct();

                const serialized = TransactionFactory.fromData(htlcRefund).serialized.toString("hex");
                const deserialized = Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, htlcRefund);

                expect(deserialized.data.asset).toEqual(htlcRefund.asset);
            });

            it("should fail to verify", () => {
                const htlcRefund = BuilderFactory.htlcRefund()
                    .fee("0")
                    .network(23)
                    .htlcRefundAsset(htlcRefundAsset)
                    .sign("dummy passphrase")
                    .build();

                configManager.getMilestone().aip11 = false;
                expect(htlcRefund.verify()).toBeFalse();
                configManager.getMilestone().aip11 = true;
                expect(htlcRefund.verify()).toBeTrue();
            });
        });
    });

    describe("deserialize - others", () => {
        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            configManager.setConfig(Generators.generateCryptoConfigRaw());
        });

        it("should throw if type is not supported", () => {
            const serializeWrongType = (transaction: ITransactionData) => {
                // copy-paste from transaction serializer, common stuff
                const buffer = new ByteBuffer(512, true);
                buffer.writeByte(0xff);
                buffer.writeByte(2);
                buffer.writeByte(transaction.network);
                buffer.writeUint32(Enums.TransactionTypeGroup.Core);
                buffer.writeUint16(transaction.type);
                buffer.writeUint64(transaction.nonce!.toFixed());
                buffer.append(transaction.senderPublicKey, "hex");
                buffer.writeUint64(Utils.BigNumber.make(transaction.fee).toFixed());
                buffer.writeByte(0x00);

                return Buffer.from(buffer.flip().toBuffer());
            };
            const transactionWrongType = BuilderFactory.transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            const serialized = serializeWrongType(transactionWrongType).toString("hex");
            expect(() => Deserializer.deserialize(serialized)).toThrow(UnkownTransactionError);
        });
    });

    describe("deserialize Schnorr / ECDSA", () => {
        beforeEach(() => {
            configManager.getMilestone().aip11 = true;
        });

        const builderWith = (
            hasher: (buffer: Buffer, keys: IKeyPair) => string,
            hasher2?: (buffer: Buffer, keys: IKeyPair) => string,
        ) => {
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

            builder.data.signature = hasher(buffer, keys);

            if (hasher2) {
                const keys = Keys.fromPassphrase("secret 2");
                const buffer = TransactionUtils.toHash(builder.data, {
                    excludeSecondSignature: true,
                });

                builder.data.secondSignature = hasher2(buffer, keys);
            }

            return builder;
        };

        it("should deserialize a V2 transaction signed with Schnorr", () => {
            const builder = builderWith(Hash.signSchnorr);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();
            expect(transaction!.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction signed with ECDSA", () => {
            const builder = builderWith(Hash.signECDSA);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(builder.data.signature).not.toHaveLength(64);
            expect(() => (transaction = builder.build())).not.toThrow();
            expect(transaction!.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction when signed with Schnorr/Schnorr", () => {
            const builder = builderWith(Hash.signSchnorr, Hash.signSchnorr);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();

            expect(transaction!.verify()).toBeTrue();
            expect(Verifier.verifySecondSignature(transaction!.data, PublicKey.fromPassphrase("secret 2"))).toBeTrue();
            expect(Verifier.verifySecondSignature(transaction!.data, PublicKey.fromPassphrase("secret 3"))).toBeFalse();
        });

        it("should throw when V2 transaction is signed with Schnorr and ECDSA", () => {
            let builder = builderWith(Hash.signSchnorr, Hash.signECDSA);
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            builder = builderWith(Hash.signECDSA, Hash.signSchnorr);
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();
        });

        it("should throw when V2 transaction is signed with Schnorr and AIP11 not active", () => {
            const builder = builderWith(Hash.signSchnorr);

            configManager.getMilestone().aip11 = false;
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            configManager.getMilestone().aip11 = true;
        });

        it("should throw when V1 transaction is signed with Schnorr", () => {
            configManager.getMilestone().aip11 = false;

            const builder = builderWith(Hash.signSchnorr);
            const buffer = TransactionUtils.toHash(builder.data, {
                excludeSignature: true,
                excludeSecondSignature: true,
            });

            builder.data.signature = builder.data.signature = Hash.signSchnorr(buffer, Keys.fromPassphrase("secret"));

            expect(builder.data.version).toBe(1);
            expect(() => builder.build()).toThrow();

            configManager.getMilestone().aip11 = true;
        });
    });

    describe("serialize - others", () => {
        it("should throw if type is not supported", () => {
            const transactionWrongType = BuilderFactory.transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            expect(() => TransactionFactory.fromData(transactionWrongType)).toThrow(UnkownTransactionError);
        });
    });

    describe("getBytesV1", () => {
        beforeAll(() => (configManager.getMilestone().aip11 = false));
        afterAll(() => (configManager.getMilestone().aip11 = true));
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
                amount: Utils.BigNumber.make(1000),
                fee: Utils.BigNumber.make(2000),
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
        //
        //   bytes = crypto.getBytes(transaction)
        //   expect(bytes).toBeObject()
        //   expect(bytes.toString('hex') + transaction.signature + transaction.secondSignature).toHaveLength(420)
        // })

        it("should return Buffer of transaction with second signature and buffer must be 266 length", () => {
            const transaction = {
                version: 1,
                type: 0,
                amount: Utils.BigNumber.make(1000),
                fee: Utils.BigNumber.make(2000),
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
                amount: Utils.BigNumber.make(1000),
                fee: Utils.BigNumber.make(2000),
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
