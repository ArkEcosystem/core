import { Deserializer } from "../../../../packages/crypto/src/blocks/deserializer";
import { Serializer } from "../../../../packages/crypto/src/blocks/serializer";
import { configManager } from "../../../../packages/crypto/src/managers";
import { dummyBlock2, dummyBlock3 } from "../fixtures/block";

describe("block deserializer", () => {
    describe("deserialize", () => {
        it("should get block id from outlook table", () => {
            const outlookTableBlockId = "123456";
            configManager.set("exceptions.outlookTable", { [dummyBlock3.id]: outlookTableBlockId });

            const deserialized = Deserializer.deserialize(Serializer.serialize(dummyBlock3), true).data;

            expect(deserialized.id).toEqual(outlookTableBlockId);

            configManager.set("exceptions.outlookTable", {});
        });

        it("should correctly deserialize a block", () => {
            const deserialized = Deserializer.deserialize(Buffer.from(dummyBlock2.serializedFull, "hex")).data;

            const blockFields = [
                "id",
                "timestamp",
                "version",
                "height",
                "previousBlock",
                "numberOfTransactions",
                "totalAmount",
                "totalFee",
                "reward",
                "payloadLength",
                "payloadHash",
                "generatorPublicKey",
                "blockSignature",
            ];
            blockFields.forEach((field) => {
                expect(deserialized[field].toString()).toEqual(dummyBlock2.data[field].toString());
            });

            expect(deserialized.transactions).toHaveLength(dummyBlock2.data.transactions.length);

            const transactionFields = [
                "id",
                "type",
                "timestamp",
                "senderPublicKey",
                "fee",
                "amount",
                "recipientId",
                "signature",
            ];
            deserialized.transactions.forEach((tx) => {
                const dummyBlockTx = dummyBlock2.data.transactions.find((dummyTx) => dummyTx.id === tx.id);
                expect(dummyBlockTx).toBeDefined();
                transactionFields.forEach((field) => {
                    expect(tx[field].toString()).toEqual(dummyBlockTx[field].toString());
                });
            });
        });
    });
});
