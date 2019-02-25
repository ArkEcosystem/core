import ByteBuffer from "bytebuffer";
import { client } from "../../../../packages/crypto/src/client";
import { TransactionDeserializer } from "../../../../packages/crypto/src/deserializers";
import { TransactionSerializer } from "../../../../packages/crypto/src/serializers";
import { Bignum } from "../../../../packages/crypto/src/utils";

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized, expected) => {
        const fieldsToCheck = ["version", "network", "type", "timestamp", "senderPublicKey", "fee", "amount"];
        fieldsToCheck.forEach(field => {
            expect(deserialized[field].toString()).toEqual(expected[field].toString());
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
            const serialized = TransactionSerializer.serialize(transfer).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.vendorField).toBe(transfer.vendorField);
            expect(deserialized.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize giving back original fields - with vendorFieldHex", () => {
            delete transfer.vendorField;
            const vendorField = "cool vendor field";
            transfer.vendorFieldHex = new Buffer(vendorField).toString("hex");

            const serialized = TransactionSerializer.serialize(transfer).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.vendorField).toBe(vendorField);
            expect(deserialized.recipientId).toBe(transfer.recipientId);
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

            const serialized = TransactionSerializer.serialize(secondSignature).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, secondSignature);

            expect(deserialized.asset).toEqual(secondSignature.asset);
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

            const serialized = TransactionSerializer.serialize(delegateRegistration).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateRegistration);

            expect(deserialized.asset).toEqual(delegateRegistration.asset);
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

            const serialized = TransactionSerializer.serialize(vote).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, vote);

            expect(deserialized.asset).toEqual(vote.asset);
        });
    });

    describe("ser/deserialize - multi signature", () => {
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
            const serialized = TransactionSerializer.serialize(multiSignature).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiSignature);

            expect(deserialized.asset).toEqual(multiSignature.asset);
        });

        it("should ser/deserialize giving back original fields - v2 keysgroup", () => {
            multiSignature.asset.multisignature.keysgroup = [
                "0376982a97dadbc65e694743d386084548a65431a82ce935ac9d957b1cffab2784",
                "03793904e0df839809bc89f2839e1ae4f8b1ea97ede6592b7d1e4d0ee194ca2998",
            ];
            multiSignature.version = 2;

            const serialized = TransactionSerializer.serialize(multiSignature).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiSignature);

            expect(deserialized.asset).toEqual(multiSignature.asset);
        });
    });

    describe("ser/deserialize - ipfs", () => {
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

            const serialized = TransactionSerializer.serialize(ipfs).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, ipfs);

            expect(deserialized.asset).toEqual(ipfs.asset);
        });
    });

    describe("ser/deserialize - timelock transfer", () => {
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
            const serialized = TransactionSerializer.serialize(timelockTransfer).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, timelockTransfer);

            expect(deserialized.timelockType).toEqual(timelockTransfer.timelockType);
            expect(deserialized.timelock).toEqual(timelockTransfer.timelock);
        });
    });

    describe("ser/deserialize - multi payment", () => {
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

            const serialized = TransactionSerializer.serialize(multiPayment).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiPayment);

            expect(deserialized.asset).toEqual(multiPayment.asset);
        });
    });

    describe("ser/deserialize - delegate resignation", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateResignation = client
                .getBuilder()
                .delegateResignation()
                .fee(50000000)
                .version(1)
                .network(30)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = TransactionSerializer.serialize(delegateResignation).toString("hex");
            const deserialized = TransactionDeserializer.deserialize(serialized);

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
            expect(() => TransactionDeserializer.deserialize(serialized)).toThrow(
                `Type ${transactionWrongType.type} not supported.`,
            );
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

            expect(() => TransactionSerializer.serialize(transactionWrongType)).toThrow(
                `Type ${transactionWrongType.type} not supported.`,
            );
        });
    });
});
