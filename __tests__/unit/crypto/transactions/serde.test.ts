import { Address, PublicKey } from "@packages/crypto/src/identities";
import { Keys } from "@packages/crypto/src/identities";
import { ITransaction } from "@packages/crypto/src/interfaces";
import { configManager } from "@packages/crypto/src/managers";
import {
    Deserializer,
    InternalTransactionType,
    Serializer,
    Signer,
    Transaction,
    TransactionTypeFactory,
} from "@packages/crypto/src/transactions";
import { BigNumber, ByteBuffer } from "@packages/crypto/src/utils";

configManager.getMilestone().aip11 = true;

class TestTransaction extends Transaction {
    public hasVendorField(): boolean {
        return true;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(Buffer.alloc(33));
        buffer.writeBigUInt64LE(data.amount.toBigInt());
        buffer.writeUInt32LE(data.expiration || 0);

        if (data.recipientId) {
            const { addressBuffer } = Address.toBuffer(data.recipientId);

            buffer.writeBuffer(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readBigInt64LE().toString());
        data.expiration = buf.readUInt32LE();
        data.recipientId = Address.fromBuffer(buf.readBuffer(21));
    }
}

type TransactionConstructorMap = Map<number, typeof Transaction>;

const registerTransactionTypes = (transaction: typeof Transaction) => {
    const testInternalTransactionType = InternalTransactionType.from(1, 3);

    const transactionConstructors: TransactionConstructorMap = new Map();
    transactionConstructors.set(1, transaction);

    const transactionTypes: Map<InternalTransactionType, TransactionConstructorMap> = new Map();
    transactionTypes.set(testInternalTransactionType, transactionConstructors);

    TransactionTypeFactory.initialize(transactionTypes);
};

// @ts-ignore
const checkCommonFields = (deserialized: ITransaction, expected) => {
    // const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount"];
    const fieldsToCheck = ["version", "type", "senderPublicKey", "recipientId", "fee"];
    if (deserialized.data.version === 1) {
        fieldsToCheck.push("timestamp");
    } else {
        fieldsToCheck.push("typeGroup");
        fieldsToCheck.push("nonce");
    }

    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

const checkV2Fields = (deserialized: ITransaction, expected) => {
    const fieldsToCheck = ["version", "type", "senderPublicKey", "recipientId", "fee", "typeGroup", "nonce", "amount"];

    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

describe("Transaction serializer / deserializer", () => {
    describe("signatures", () => {
        it("should ser/deser single sing", () => {
            registerTransactionTypes(TestTransaction);

            const transaction = new TestTransaction();
            transaction.data = {
                amount: new BigNumber(100),
                fee: new BigNumber(200),
                nonce: new BigNumber(1),
                senderPublicKey: PublicKey.fromPassphrase("sender passphrase"),
                recipientId: Address.fromPassphrase("recipient passphrase"),
                timestamp: 0,
                type: 1,
                expiration: 0,
                typeGroup: 3,
                version: 2,
            };

            Signer.sign(transaction.data, Keys.fromPassphrase("sender passphrase"));

            const serialized = Serializer.serialize(transaction);
            expect(serialized.toString("hex")).toEqual(
                "ff" + // Header
                    "02" + // Version
                    "1e" + // Network
                    "03000000" + // Typegroup
                    "0100" + // Type
                    "0100000000000000" + // Nonce
                    "0316a0b23be3408a4af227280bb005e9a136e0dbdd86860516850e5c29c1829113" + // senderPublicKey
                    "c800000000000000" + // Fee
                    "00" + // VendorField lenght
                    "6400000000000000" + // Amount
                    "00000000" + // Expiration
                    "1e66314f1ccb9741d6f1a6f9b26ed563c439fc1a94" + // RecipientId
                    "fa17823c3e591586626426b494c8038d0eb10a67bcf06f2e6959a76b40898124c13e68a6ad36fd131affdeac64fc8c2b85c371b194ffc6e3ba868070fe677df2", // Signature
            );

            const deserialized = Deserializer.deserialize(serialized);
            checkV2Fields(deserialized, transaction.data);
        });

        it("should ser/deser second sign", () => {
            registerTransactionTypes(TestTransaction);

            const transaction = new TestTransaction();
            transaction.data = {
                amount: new BigNumber(100),
                fee: new BigNumber(200),
                nonce: new BigNumber(1),
                senderPublicKey: PublicKey.fromPassphrase("sender passphrase"),
                recipientId: Address.fromPassphrase("recipient passphrase"),
                timestamp: 0,
                type: 1,
                expiration: 0,
                typeGroup: 3,
                version: 2,
            };

            Signer.sign(transaction.data, Keys.fromPassphrase("sender passphrase"));
            Signer.secondSign(transaction.data, Keys.fromPassphrase("second passphrase"));

            const serialized = Serializer.serialize(transaction);
            expect(serialized.toString("hex")).toEqual(
                "ff" + // Header
                    "02" + // Version
                    "1e" + // Network
                    "03000000" + // TypeGroup
                    "0100" + // Type
                    "0100000000000000" + // Nonce
                    "0316a0b23be3408a4af227280bb005e9a136e0dbdd86860516850e5c29c1829113" + // senderPublicKey
                    "c800000000000000" + // Fee
                    "00" + // VendorField Length
                    "6400000000000000" + // Amount
                    "00000000" + // Expiration
                    "1e66314f1ccb9741d6f1a6f9b26ed563c439fc1a94" + // RecipientId
                    "fa17823c3e591586626426b494c8038d0eb10a67bcf06f2e6959a76b40898124c13e68a6ad36fd131affdeac64fc8c2b85c371b194ffc6e3ba868070fe677df2" + // Signature
                    "11816c200a139458c257fbb14c2f07c4dbb2ebf42ab9b98fbb8a702729c0427192dec75c2933db09333e2f790df652ee3a27d1e1730b8f28e786821fd9cf7587", // Second Signature
            );

            const deserialized = Deserializer.deserialize(serialized);
            checkV2Fields(deserialized, transaction.data);
        });

        it("should ser/deser multi sign", () => {
            registerTransactionTypes(TestTransaction);

            const transaction = new TestTransaction();
            transaction.data = {
                amount: new BigNumber(100),
                fee: new BigNumber(200),
                nonce: new BigNumber(1),
                senderPublicKey: PublicKey.fromPassphrase("sender passphrase"),
                recipientId: Address.fromPassphrase("recipient passphrase"),
                timestamp: 0,
                type: 1,
                expiration: 0,
                typeGroup: 3,
                version: 2,
            };

            Signer.multiSign(transaction.data, Keys.fromPassphrase("passphrase 0"), 0);
            Signer.multiSign(transaction.data, Keys.fromPassphrase("passphrase 1"), 1);
            Signer.multiSign(transaction.data, Keys.fromPassphrase("passphrase 2"), 2);

            const serialized = Serializer.serialize(transaction);
            expect(serialized.toString("hex")).toEqual(
                "ff" + // Header
                    "02" + // Version
                    "1e" + // Network
                    "03000000" + // TypeGroup
                    "0100" + // Type
                    "0100000000000000" + // Nonce
                    "0316a0b23be3408a4af227280bb005e9a136e0dbdd86860516850e5c29c1829113" + // SenderPublicKey
                    "c800000000000000" + // Fee
                    "00" + // VendorField lenght
                    "6400000000000000" + // Amount
                    "00000000" + // Expiration
                    "1e66314f1ccb9741d6f1a6f9b26ed563c439fc1a94" + // RecipientId
                    "00090bb29f6301ad77b1159b430af42fa228d21187025fc0fb347e0dc83a9eb0a21341c772f956d7349eb867072f6a09d44c828d38cb6bf52df0a06dc099bb13e2" + // 1st signature
                    "01f1241bbd5be038302c00fb6cdaf6c4da0a860fa82ef601510efaf0ca13ddd6f098db62e30d79d7190705c49366d091c136845416a295daad96a0d03149520a65" + // 2nd signature
                    "02bda0a17aa62c9c5ed904eae3915dd414e1faf67905c32c260f9c6ffbdaa9ace8b270051d9a81b243a15b4448ce97199562814cbc7c23a6375b411e9616090a67", // 3rd signature
            );

            const deserialized = Deserializer.deserialize(serialized);
            checkV2Fields(deserialized, transaction.data);
        });
    });

    describe("other", () => {
        it("should ser/deser vendorField", () => {
            registerTransactionTypes(TestTransaction);

            const transaction = new TestTransaction();
            transaction.data = {
                amount: new BigNumber(100),
                fee: new BigNumber(200),
                nonce: new BigNumber(1),
                senderPublicKey: PublicKey.fromPassphrase("sender passphrase"),
                recipientId: Address.fromPassphrase("recipient passphrase"),
                timestamp: 0,
                vendorField: "vendorField",
                type: 1,
                expiration: 0,
                typeGroup: 3,
                version: 2,
            };

            Signer.sign(transaction.data, Keys.fromPassphrase("sender passphrase"));

            const serialized = Serializer.serialize(transaction);
            expect(serialized.toString("hex")).toEqual(
                "ff" + // Header
                    "02" + // Version
                    "1e" + // Network
                    "03000000" + // Typegroup
                    "0100" + // Type
                    "0100000000000000" + // Nonce
                    "0316a0b23be3408a4af227280bb005e9a136e0dbdd86860516850e5c29c1829113" + // senderPublicKey
                    "c800000000000000" + // Fee
                    "0b" + // VendorField length
                    "76656e646f724669656c64" + // VendorField length
                    "6400000000000000" + // Amount
                    "00000000" + // Expiration
                    "1e66314f1ccb9741d6f1a6f9b26ed563c439fc1a94" + // RecipientId
                    "95a6303660af0a43d71d9d7434aababfd5fd9679c690164c3aea32ff3793ce00dc50868a41f379eee5470498e4c0a125f9dd5c6c12d1c5b1d7e708be6883ca31", // Signature
            );

            const deserialized = Deserializer.deserialize(serialized);
            checkV2Fields(deserialized, transaction.data);
        });

        it("should ser/deser V1", () => {
            configManager.getMilestone().aip11 = false;

            registerTransactionTypes(TestTransaction);

            const transaction = new TestTransaction();
            transaction.data = {
                amount: new BigNumber(100),
                fee: new BigNumber(200),
                nonce: new BigNumber(1),
                senderPublicKey: PublicKey.fromPassphrase("sender passphrase"),
                recipientId: Address.fromPassphrase("recipient passphrase"),
                timestamp: 0,
                type: 1,
                expiration: 0,
                typeGroup: 3,
                version: 1,
            };

            Signer.sign(transaction.data, Keys.fromPassphrase("sender passphrase"));
            const serialized = Serializer.serialize(transaction);

            expect(serialized.toString("hex")).toEqual(
                "ff011e01000000000316a0b23be3408a4af227280bb005e9a136e0dbdd86860516850e5c29c1829113c800000000000000006400000000000000000000001e66314f1ccb9741d6f1a6f9b26ed563c439fc1a9430450221008067d1beb623f2e7dbcb8580c0036a2d4a59c1a64fc3ba66f05fcea5a0614c6302203e94b41d50ca69498e4970d8a289c431474728e26652db8889bec4d8d0001144",
            );
        });
    });
});
