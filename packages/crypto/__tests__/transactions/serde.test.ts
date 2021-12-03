import { Address, PublicKey } from "@packages/crypto/src/identities";
import { ITransaction } from "@packages/crypto/src/interfaces";
import { configManager } from "@packages/crypto/src/managers";
import {
    Deserializer,
    InternalTransactionType,
    Serializer,
    Transaction,
    TransactionTypeFactory,
} from "@packages/crypto/src/transactions";
import { BigNumber } from "@packages/crypto/src/utils";
import ByteBuffer from "bytebuffer";

configManager.getMilestone().aip11 = true;

class TestTransaction extends Transaction {
    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(24, true);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());
        buffer.writeUint32(data.expiration || 0);

        if (data.recipientId) {
            const { addressBuffer } = Address.toBuffer(data.recipientId);

            buffer.append(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = Address.fromBuffer(buf.readBytes(21).toBuffer());
    }
}

type TransactionConstructorMap = Map<number, typeof Transaction>;

const testInternalTransactionType = InternalTransactionType.from(1, 3);

const transactionConstructors: TransactionConstructorMap = new Map();
transactionConstructors.set(1, TestTransaction);

const transactionTypes: Map<InternalTransactionType, TransactionConstructorMap> = new Map();
transactionTypes.set(testInternalTransactionType, transactionConstructors);

TransactionTypeFactory.initialize(transactionTypes);

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

describe("Transaction serializer / deserializer", () => {
    it("should ser/deser", () => {
        const transaction = new TestTransaction();
        transaction.data = {
            amount: new BigNumber(100),
            fee: new BigNumber(200),
            nonce: new BigNumber(1),
            senderPublicKey: PublicKey.fromPassphrase("dummy passphrase"),
            recipientId: Address.fromPassphrase("dummy passphrase"),
            timestamp: 0,
            type: 1,
            expiration: 0,
            typeGroup: 3,
            version: 2,
        };

        const serialized = Serializer.serialize(transaction);
        expect(serialized.toString("hex")).toEqual(
            "ff021e030000000100010000000000000002a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087c800000000000000006400000000000000000000001ead1078c2cf414861ab43f771e36198dc63b987a1",
        );

        const deserialized = Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, transaction.data);
    });
});
