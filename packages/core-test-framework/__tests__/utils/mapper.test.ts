import "jest-extended";

import { Models } from "@arkecosystem/core-database";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { mapTransactionToModel } from "@packages/core-test-framework/src/utils/mapper";

let transaction: Interfaces.ITransaction;
let transactionModel: Models.Transaction;

beforeEach(() => {
    transaction = {
        id: "f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177",
        type: 2,
        typeGroup: 1,
        verified: true,
        isVerified: true,
        key: "123",
        staticFee: Utils.BigNumber.make(5),
        timestamp: 2000123,
        data: {
            id: "f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177",
            version: 2,
            network: 23,
            type: 2,
            typeGroup: 1,
            timestamp: 2000123,
            nonce: Utils.BigNumber.make(5),
            senderPublicKey: "025805c82bb3ff7068e1b20da4ad2f89638e404950b0af7a0d2e23512b3701a21a",
            fee: Utils.BigNumber.make(5),
            amount: Utils.BigNumber.make(5),
            recipientId: "D7RVC5iZqs3f8ETtHRL3REeVzsxrrBexcT",
            signature:
                "efd9acefcc843123f7f518ebc34cd8a81ba536b9604d42eaf3bc84fa9df4e2f51e4596ca2671e5726e99bff83a85f98122512ec9ed5f9a3de97045d23f6c94f3",
            blockId: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
            blockHeight: 5,
            sequence: 1,
            asset: {},
        },
        serialized: Buffer.from(""),
        serialize: jest.fn(),
        deserialize: jest.fn(),
        verify: jest.fn(),
        verifySchema: jest.fn(),
        toJson: jest.fn(),
        hasVendorField: jest.fn(),
    };

    transactionModel = {
        id: "f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177",
        version: 2,
        blockId: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
        blockHeight: 5,
        sequence: 1,
        timestamp: 2000123,
        nonce: Utils.BigNumber.make(5),
        senderPublicKey: "025805c82bb3ff7068e1b20da4ad2f89638e404950b0af7a0d2e23512b3701a21a",
        recipientId: "D7RVC5iZqs3f8ETtHRL3REeVzsxrrBexcT",
        type: 2,
        typeGroup: 1,
        vendorField: undefined,
        amount: Utils.BigNumber.make(5),
        fee: Utils.BigNumber.make(5),
        serialized: Buffer.from(""),
        asset: {},
    };
});

describe("Mapper", () => {
    describe("mapTransactionToModel", () => {
        it("should convert crypto transaction to database model", async () => {
            expect(mapTransactionToModel(transaction)).toEqual(transactionModel);
        });

        it("should convert crypto transaction to database model replacing blockHeight", async () => {
            expect(mapTransactionToModel(transaction, 100)).toEqual({ ...transactionModel, blockHeight: 100 });
        });

        it("should convert crypto transaction to database model replacing sequence", async () => {
            expect(mapTransactionToModel(transaction, undefined, 10)).toEqual({ ...transactionModel, sequence: 10 });
        });

        it("should convert crypto transaction to database model without blockHeight or sequence", async () => {
            const clone = { ...transaction, data: { ...transaction.data } };
            delete clone.data.blockHeight;
            delete clone.data.sequence;
            expect(mapTransactionToModel(clone)).toEqual({ ...transactionModel, blockHeight: 0, sequence: 0 });
        });

        it("should convert crypto transaction to database model without optional parameters", async () => {
            delete transaction.data.version;
            delete transaction.data.blockId;
            delete transaction.data.nonce;
            delete transaction.data.senderPublicKey;
            delete transaction.data.recipientId;
            delete transaction.data.typeGroup;

            transactionModel.version = 1;
            transactionModel.blockId = "";
            transactionModel.nonce = Utils.BigNumber.make(1);
            transactionModel.senderPublicKey = "";
            transactionModel.recipientId = "";
            transactionModel.typeGroup = 1;

            expect(mapTransactionToModel(transaction)).toEqual(transactionModel);
        });
    });
});
