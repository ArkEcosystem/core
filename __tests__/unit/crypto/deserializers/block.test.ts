import { configManager } from "../../../../packages/crypto/src/managers";
import { dummyBlock2, dummyBlock3 } from "../fixtures/block";

let BlockDeserializer;
let BlockSerializer;

describe("block deserializer", () => {
    describe("deserialize", () => {
        it("should get block id from outlook table", () => {
            const outlookTableBlockId = "123456";
            const getPresetOrig = configManager.getPreset;
            jest.spyOn(configManager, "getPreset").mockImplementation(network => {
                const preset = getPresetOrig(network);
                preset.exceptions.outlookTable = {
                    [dummyBlock3.id]: outlookTableBlockId,
                };
                return preset;
            });
            BlockDeserializer = require("../../../../packages/crypto/src/deserializers").BlockDeserializer;
            BlockSerializer = require("../../../../packages/crypto/src/serializers").BlockSerializer;

            const deserialized = BlockDeserializer.deserialize(
                BlockSerializer.serialize(dummyBlock3).toString("hex"),
                true,
            );

            expect(deserialized.id).toEqual(outlookTableBlockId);
        });

        it("should correctly deserialize a block", () => {
            const deserialized = BlockDeserializer.deserialize(dummyBlock2.serializedFull);

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
                const dummyBlockTx = dummyBlock2.data.transactions.find(dummyTx => dummyTx.id === tx.data.id);
                expect(dummyBlockTx).toBeDefined();
                transactionFields.forEach(field => {
                    expect(tx.data[field].toString()).toEqual(dummyBlockTx[field].toString());
                });
            });
        });
    });
});
