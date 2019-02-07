import { configManager } from "../../../src/managers";
import { BlockDeserializer } from "../../../src/transactions/deserializers";
import { BlockSerializer } from "../../../src/transactions/serializers";
import { dummyBlock2, dummyBlock3 } from "../../fixtures/block";

describe("block deserializer", () => {
    describe("deserialize", () => {
        it("should get block id from outlook table", () => {
            const outlookTableBlockId = "123456";
            configManager.config.exceptions.outlookTable = { [dummyBlock3.id]: outlookTableBlockId };

            const deserialized = BlockDeserializer.deserialize(
                BlockSerializer.serialize(dummyBlock3).toString("hex"),
                true,
            ).data;

            expect(deserialized.id).toEqual(outlookTableBlockId);
            delete configManager.config.exceptions.outlookTable;
        });

        it("should correctly deserialize a block", () => {
            const deserialized = BlockDeserializer.deserialize(dummyBlock2.serializedFull).data;

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
            blockFields.forEach(field => {
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
                "vendorField",
                "signature",
            ];
            deserialized.transactions.forEach(tx => {
                const dummyBlockTx = dummyBlock2.data.transactions.find(dummyTx => dummyTx.id === tx.id);
                expect(dummyBlockTx).toBeDefined();
                transactionFields.forEach(field => {
                    expect(tx[field].toString()).toEqual(dummyBlockTx[field].toString());
                });
            });
        });
    });
});
