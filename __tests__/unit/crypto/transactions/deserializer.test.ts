import "jest-extended";

import ByteBuffer from "bytebuffer";
import { client } from "../../../../packages/crypto/src/client";
import {
    TransactionSchemaError,
    TransactionVersionError,
    UnkownTransactionError,
} from "../../../../packages/crypto/src/errors";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Transaction } from "../../../../packages/crypto/src/transactions";
import { transactionDeserializer } from "../../../../packages/crypto/src/transactions/deserializer";
import { TransactionSerializer } from "../../../../packages/crypto/src/transactions/serializer";
import { Bignum } from "../../../../packages/crypto/src/utils";

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized: Transaction, expected) => {
        const fieldsToCheck = ["version", "network", "type", "timestamp", "senderPublicKey", "fee", "amount"];
        fieldsToCheck.forEach(field => {
            expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
        });
    };

    describe("ser/deserialize - transfer", () => {
        const transfer = client
            .getBuilder()
            .transfer()
            .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
            .amount(10000)
            .fee(50000000)
            .vendorField("yo")
            .version(1)
            .network(30)
            .sign("dummy passphrase")
            .getStruct();

        it("should ser/deserialize giving back original fields", () => {
            const serialized = Transaction.fromData(transfer).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(transfer.vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize giving back original fields - with vendorFieldHex", () => {
            delete transfer.vendorField;
            const vendorField = "cool vendor field";
            transfer.vendorFieldHex = new Buffer(vendorField).toString("hex");

            const serialized = Transaction.fromData(transfer).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize with long vendorfield when vendorFieldLength=255 milestone is active", () => {
            configManager.getMilestone().vendorFieldLength = 255;

            const transferWithLongVendorfield = client
                .getBuilder()
                .transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(10000)
                .fee(50000000)
                .vendorField("y".repeat(255))
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.toBytes(transferWithLongVendorfield);
            const deserialized = Transaction.fromBytes(serialized);

            expect(deserialized.verified).toBeTrue();
            expect(deserialized.data.vendorField).toHaveLength(255);
            expect(deserialized.data.vendorFieldHex).toHaveLength(510);
            expect(deserialized.data.vendorField).toEqual("y".repeat(255));

            configManager.getMilestone().vendorFieldLength = 64;
        });

        it("should not ser/deserialize long vendorfield when vendorFieldLength=255 milestone is not active", () => {
            const transferWithLongVendorfield = client
                .getBuilder()
                .transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(10000)
                .fee(50000000)
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            transferWithLongVendorfield.vendorField = "y".repeat(255);
            expect(() => {
                const serialized = Transaction.toBytes(transferWithLongVendorfield);
                Transaction.fromBytes(serialized);
            }).toThrow(TransactionSchemaError);
        });
    });

    describe("ser/deserialize - second signature", () => {
        it("should ser/deserialize giving back original fields", () => {
            const secondSignature = client
                .getBuilder()
                .secondSignature()
                .signatureAsset("signature")
                .fee(50000000)
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(secondSignature).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, secondSignature);

            expect(deserialized.data.asset).toEqual(secondSignature.asset);
        });
    });

    describe("ser/deserialize - delegate registration", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateRegistration = client
                .getBuilder()
                .delegateRegistration()
                .usernameAsset("homer")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(delegateRegistration).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateRegistration);

            expect(deserialized.data.asset).toEqual(delegateRegistration.asset);
        });
    });

    describe("ser/deserialize - vote", () => {
        it("should ser/deserialize giving back original fields", () => {
            const vote = client
                .getBuilder()
                .vote()
                .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
                .fee(50000000)
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(vote).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, vote);

            expect(deserialized.data.asset).toEqual(vote.asset);
        });
    });

    describe.skip("ser/deserialize - multi signature", () => {
        const multiSignature = client
            .getBuilder()
            .multiSignature()
            .multiSignatureAsset({
                keysgroup: [
                    "+0376982a97dadbc65e694743d386084548a65431a82ce935ac9d957b1cffab2784",
                    "+03793904e0df839809bc89f2839e1ae4f8b1ea97ede6592b7d1e4d0ee194ca2998",
                ],
                lifetime: 72,
                min: 2,
            })
            .version(1)
            .network(30)
            .sign("dummy passphrase")
            .multiSignatureSign("multi passphrase 1")
            .multiSignatureSign("multi passphrase 2")
            .getStruct();

        it("should ser/deserialize giving back original fields", () => {
            const serialized = Transaction.fromData(multiSignature).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiSignature);

            expect(deserialized.data.asset).toEqual(multiSignature.asset);
        });

        it("should ser/deserialize giving back original fields - v2 keysgroup", () => {
            multiSignature.asset.multisignature.keysgroup = [
                "+0376982a97dadbc65e694743d386084548a65431a82ce935ac9d957b1cffab2784",
                "+03793904e0df839809bc89f2839e1ae4f8b1ea97ede6592b7d1e4d0ee194ca2998",
            ];

            const serialized = Transaction.fromData(multiSignature).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiSignature);

            expect(deserialized.data.asset).toEqual(multiSignature.asset);
        });
    });

    describe.skip("ser/deserialize - ipfs", () => {
        it("should ser/deserialize giving back original fields", () => {
            const ipfs = client
                .getBuilder()
                .ipfs()
                .fee(50000000)
                .version(1)
                .network(30)
                .dag("da304502")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(ipfs).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, ipfs);

            expect(deserialized.data.asset).toEqual(ipfs.asset);
        });
    });

    describe.skip("ser/deserialize - timelock transfer", () => {
        it("should ser/deserialize giving back original fields", () => {
            const timelockTransfer = client
                .getBuilder()
                .timelockTransfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(10000)
                .fee(50000000)
                .version(1)
                .network(30)
                .timelock(12, 0x00)
                .sign("dummy passphrase")
                .getStruct();

            // expect(timelockTransfer).toEqual({})
            const serialized = Transaction.fromData(timelockTransfer).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, timelockTransfer);

            expect(deserialized.data.timelockType).toEqual(timelockTransfer.timelockType);
            expect(deserialized.data.timelock).toEqual(timelockTransfer.timelock);
        });
    });

    describe.skip("ser/deserialize - multi payment", () => {
        it("should ser/deserialize giving back original fields", () => {
            const multiPayment = client
                .getBuilder()
                .multiPayment()
                .fee(50000000)
                .version(1)
                .network(30)
                .addPayment("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F", 1555)
                .addPayment("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F", 5000)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(multiPayment).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiPayment);

            expect(deserialized.data.asset).toEqual(multiPayment.asset);
        });
    });

    describe.skip("ser/deserialize - delegate resignation", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateResignation = client
                .getBuilder()
                .delegateResignation()
                .fee(50000000)
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = Transaction.fromData(delegateResignation).serialized.toString("hex");
            const deserialized = transactionDeserializer.deserialize(serialized);

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
                buffer.writeUint64(+new Bignum(transaction.fee).toFixed());
                buffer.writeByte(0x00);

                return Buffer.from(buffer.flip().toBuffer());
            };
            const transactionWrongType = client
                .getBuilder()
                .transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(10000)
                .fee(50000000)
                .vendorField("yo")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            const serialized = serializeWrongType(transactionWrongType).toString("hex");
            expect(() => transactionDeserializer.deserialize(serialized)).toThrow(UnkownTransactionError);
        });
    });

    describe("serialize - others", () => {
        it("should throw if type is not supported", () => {
            const transactionWrongType = client
                .getBuilder()
                .transfer()
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(10000)
                .fee(50000000)
                .vendorField("yo")
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            expect(() => Transaction.fromData(transactionWrongType)).toThrow(UnkownTransactionError);
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
                amount: 1000,
                fee: 2000,
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            bytes = TransactionSerializer.getBytes(transaction);
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
                amount: 1000,
                fee: 2000,
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

            bytes = TransactionSerializer.getBytes(transaction);
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
                amount: 1000,
                fee: 2000,
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

            expect(() => TransactionSerializer.getBytes(transaction)).toThrow(TransactionVersionError);
        });
    });
});
