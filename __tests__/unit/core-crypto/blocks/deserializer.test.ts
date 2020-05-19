import { CryptoSuite } from "../../../../packages/core-crypto";
// import { Deserializer } from "../../../../packages/core-crypto/src/blocks/deserializer";
// import { Serializer } from "../../../../packages/core-crypto/src/blocks/serializer";
import { makeDummyBlock2, makeDummyBlock3 } from "../fixtures/block";

let crypto: CryptoSuite.CryptoSuite;
let dummyBlock2;
let dummyBlock3;
let Serializer;
let Deserializer;

beforeAll(() => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
    Serializer = crypto.BlockFactory.serializer;
    Deserializer = crypto.BlockFactory.deserializer;
    dummyBlock2 = makeDummyBlock2(crypto.CryptoManager);
    dummyBlock3 = makeDummyBlock3(crypto.CryptoManager);
});

describe("block deserializer", () => {
    describe("deserialize", () => {
        it("should get block id from outlook table", () => {
            const outlookTableBlockId = "123456";
            crypto.CryptoManager.NetworkConfigManager.set("exceptions.outlookTable", {
                [dummyBlock3.id]: outlookTableBlockId,
            });

            const deserialized = Deserializer.deserialize(Serializer.serialize(dummyBlock3).toString("hex"), true).data;

            expect(deserialized.id).toEqual(outlookTableBlockId);

            crypto.CryptoManager.NetworkConfigManager.set("exceptions.outlookTable", {});
        });

        it("should correctly deserialize a block", () => {
            const deserialized = Deserializer.deserialize(dummyBlock2.serializedFull).data;

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
