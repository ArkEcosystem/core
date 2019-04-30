import "jest-extended";

import ByteBuffer from "bytebuffer";
import { Utils } from "../../../../packages/crypto/src";
import {
    MalformedTransactionBytesError,
    TransactionSchemaError,
    TransactionVersionError,
    UnkownTransactionError,
} from "../../../../packages/crypto/src/errors";
import { Keys } from "../../../../packages/crypto/src/identities";
import { ITransaction } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Transaction, TransactionFactory } from "../../../../packages/crypto/src/transactions";
import { BuilderFactory } from "../../../../packages/crypto/src/transactions/builders";
import { deserializer } from "../../../../packages/crypto/src/transactions/deserializer";
import { Serializer } from "../../../../packages/crypto/src/transactions/serializer";
import { legacyMultiSignatureRegistration } from "./__fixtures__/transaction";

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized: ITransaction, expected) => {
        const fieldsToCheck = ["version", "network", "type", "timestamp", "senderPublicKey", "fee", "amount"];
        fieldsToCheck.forEach(field => {
            expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
        });
    };

    describe("ser/deserialize - transfer", () => {
        const transfer = BuilderFactory.transfer()
            .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
            .amount("10000")
            .fee("50000000")
            .vendorField("yo")
            .version(1)
            .network(30)
            .sign("dummy passphrase")
            .getStruct();

        it("should ser/deserialize giving back original fields", () => {
            const serialized = TransactionFactory.fromData(transfer).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(transfer.vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize giving back original fields - with vendorFieldHex", () => {
            delete transfer.vendorField;
            const vendorField = "cool vendor field";
            transfer.vendorFieldHex = new Buffer(vendorField).toString("hex");

            const serialized = TransactionFactory.fromData(transfer).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize with long vendorfield when vendorFieldLength=255 milestone is active", () => {
            configManager.getMilestone().vendorFieldLength = 255;

            const transferWithLongVendorfield = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .vendorField("y".repeat(255))
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.toBytes(transferWithLongVendorfield);
            const deserialized = TransactionFactory.fromBytes(serialized);

            expect(deserialized.verified).toBeTrue();
            expect(deserialized.data.vendorField).toHaveLength(255);
            expect(deserialized.data.vendorFieldHex).toHaveLength(510);
            expect(deserialized.data.vendorField).toEqual("y".repeat(255));

            configManager.getMilestone().vendorFieldLength = 64;
        });

        it("should not ser/deserialize long vendorfield when vendorFieldLength=255 milestone is not active", () => {
            const transferWithLongVendorfield = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            transferWithLongVendorfield.vendorField = "y".repeat(255);
            expect(() => {
                const serialized = Transaction.toBytes(transferWithLongVendorfield);
                TransactionFactory.fromBytes(serialized);
            }).toThrow(TransactionSchemaError);
        });
    });

    describe("ser/deserialize - second signature", () => {
        it("should ser/deserialize giving back original fields", () => {
            const secondSignature = BuilderFactory.secondSignature()
                .signatureAsset("signature")
                .fee("50000000")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(secondSignature).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, secondSignature);

            expect(deserialized.data.asset).toEqual(secondSignature.asset);
        });
    });

    describe("ser/deserialize - delegate registration", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateRegistration = BuilderFactory.delegateRegistration()
                .usernameAsset("homer")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(delegateRegistration).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateRegistration);

            expect(deserialized.data.asset).toEqual(delegateRegistration.asset);
        });
    });

    describe("ser/deserialize - vote", () => {
        it("should ser/deserialize giving back original fields", () => {
            const vote = BuilderFactory.vote()
                .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
                .fee("50000000")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(vote).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

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
            configManager.setFromPreset("testnet");

            const participant1 = Keys.fromPassphrase("secret 1");
            const participant2 = Keys.fromPassphrase("secret 2");
            const participant3 = Keys.fromPassphrase("secret 3");

            multiSignatureRegistration = BuilderFactory.multiSignature()
                .senderPublicKey(participant1.publicKey)
                .network(23)
                .participant(participant1.publicKey)
                .participant(participant2.publicKey)
                .participant(participant3.publicKey)
                .min(3)
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2)
                .sign("secret 1").data;
        });

        it("should ser/deserialize a multisig registration", () => {
            const transaction = TransactionFactory.fromData(multiSignatureRegistration);
            const deserialized = TransactionFactory.fromBytes(transaction.serialized);

            expect(transaction.isVerified).toBeTrue();
            expect(deserialized.isVerified).toBeTrue();
            expect(deserialized.data.asset).toEqual(multiSignatureRegistration.asset);
            expect(transaction.data.signatures).toEqual(deserialized.data.signatures);
            checkCommonFields(deserialized, multiSignatureRegistration);
        });

        it("should not deserialize a malformed signature", () => {
            const transaction = TransactionFactory.fromData(multiSignatureRegistration);
            transaction.serialized = transaction.serialized.slice(0, transaction.serialized.length - 2);

            expect(() => TransactionFactory.fromBytes(transaction.serialized)).toThrowError(
                MalformedTransactionBytesError,
            );
        });
    });

    describe.skip("ser/deserialize - ipfs", () => {
        it("should ser/deserialize giving back original fields", () => {
            const ipfs = BuilderFactory.ipfs()
                .fee("50000000")
                .version(1)
                .network(30)
                .dag("da304502")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(ipfs).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, ipfs);

            expect(deserialized.data.asset).toEqual(ipfs.asset);
        });
    });

    describe.skip("ser/deserialize - timelock transfer", () => {
        it("should ser/deserialize giving back original fields", () => {
            const timelockTransfer = BuilderFactory.timelockTransfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .version(1)
                .network(30)
                .timelock(12, 0x00)
                .sign("dummy passphrase")
                .getStruct();

            // expect(timelockTransfer).toEqual({})
            const serialized = TransactionFactory.fromData(timelockTransfer).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, timelockTransfer);

            expect(deserialized.data.timelockType).toEqual(timelockTransfer.timelockType);
            expect(deserialized.data.timelock).toEqual(timelockTransfer.timelock);
        });
    });

    describe.skip("ser/deserialize - multi payment", () => {
        it("should ser/deserialize giving back original fields", () => {
            const multiPayment = BuilderFactory.multiPayment()
                .fee("50000000")
                .version(1)
                .network(30)
                .addPayment("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F", 1555)
                .addPayment("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F", 5000)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(multiPayment).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiPayment);

            expect(deserialized.data.asset).toEqual(multiPayment.asset);
        });
    });

    describe.skip("ser/deserialize - delegate resignation", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateResignation = BuilderFactory.delegateResignation()
                .fee("50000000")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionFactory.fromData(delegateResignation).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateResignation);
        });
    });

    describe("deserialize - others", () => {
        it("should throw if type is not supported", () => {
            const serializeWrongType = transaction => {
                // copy-paste from transaction serializer, common stuff
                const buffer = new ByteBuffer(512, true);
                buffer.writeByte(0xff); // fill, to disambiguate from v1
                buffer.writeByte(transaction.version || 0x01); // version
                buffer.writeByte(transaction.network);
                buffer.writeByte(transaction.type);
                buffer.writeUint32(transaction.timestamp);
                buffer.append(transaction.senderPublicKey, "hex");
                buffer.writeUint64(+Utils.BigNumber.make(transaction.fee).toFixed());
                buffer.writeByte(0x00);

                return Buffer.from(buffer.flip().toBuffer());
            };
            const transactionWrongType = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            const serialized = serializeWrongType(transactionWrongType).toString("hex");
            expect(() => deserializer.deserialize(serialized)).toThrow(UnkownTransactionError);
        });
    });

    describe("serialize - others", () => {
        it("should throw if type is not supported", () => {
            const transactionWrongType = BuilderFactory.transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            expect(() => TransactionFactory.fromData(transactionWrongType)).toThrow(UnkownTransactionError);
        });
    });

    describe("getBytesV1", () => {
        let bytes = null;

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
