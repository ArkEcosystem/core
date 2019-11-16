import "jest-extended";

import { Interfaces, Utils } from "@arkecosystem/crypto";
import {
    InvalidTransactionBytesError,
    TransactionSchemaError,
    UnkownTransactionError,
} from "../../../../packages/crypto/src/errors";
import { ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import {
    Serializer,
    Transaction,
    TransactionFactory,
    Utils as TransactionUtils,
} from "../../../../packages/crypto/src/transactions";
import { transaction as transactionFixture } from "../fixtures/transaction";
import { transaction as transactionDataFixture } from "../fixtures/transaction";
import { createRandomTx } from "./__support__";

let transactionData: ITransactionData;
let transactionDataJSON;

const expectTransaction = ({ data }): void => {
    expect(data).toEqual(transactionFixture);
};

beforeEach(() => {
    configManager.setFromPreset("devnet");

    transactionData = { ...transactionDataFixture };
    transactionDataJSON = {
        ...transactionData,
        ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
    };
});

const transaction: Interfaces.ITransaction = TransactionFactory.fromData(transactionFixture);
const transactionJson: Interfaces.ITransactionJson = transaction.toJson();
const transactionSerialized: Buffer = Serializer.serialize(transaction);

describe("TransactionFactory", () => {
    describe(".fromHex", () => {
        it("should pass to create a transaction from hex", () => {
            expectTransaction(TransactionFactory.fromHex(transactionSerialized.toString("hex")));
        });

        it("should fail to create a transaction from hex that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromHex("deadbeef")).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe(".fromBytes", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(TransactionFactory.fromBytes(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromBytes(Buffer.from("deadbeef"))).toThrowError(
                InvalidTransactionBytesError,
            );
        });
    });

    describe(".fromBytesUnsafe", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(TransactionFactory.fromBytesUnsafe(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromBytesUnsafe(Buffer.from("deadbeef"))).toThrowError(
                InvalidTransactionBytesError,
            );
        });

        // Old tests
        it("should be ok", () => {
            const bytes = TransactionUtils.toBytes(transactionData);
            const id = transactionData.id;

            const transaction = TransactionFactory.fromBytesUnsafe(bytes, id);
            expect(transaction).toBeInstanceOf(Transaction);
            delete transactionDataJSON.typeGroup;
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });
    });

    describe(".fromData", () => {
        it("should pass to create a transaction from an object", () => {
            expectTransaction(TransactionFactory.fromData(transaction.data));
        });

        it("should fail to create a transaction from an object that contains malformed data", () => {
            expect(() =>
                TransactionFactory.fromData({
                    ...transaction.data,
                    ...{ fee: Utils.BigNumber.make(0) },
                }),
            ).toThrowError(TransactionSchemaError);
        });

        // Old tests
        it("should match transaction id", () => {
            configManager.setFromPreset("testnet");
            for (let i = 0; i < 3; i++) {
                const transaction = createRandomTx(i);
                const originalId = transaction.data.id;
                const newTransaction = TransactionFactory.fromData(transaction.data);
                expect(newTransaction.data.id).toEqual(originalId);
            }
        });

        it("should throw when getting garbage", () => {
            expect(() => TransactionFactory.fromData({} as ITransactionData)).toThrow(UnkownTransactionError);
            expect(() => TransactionFactory.fromData({ type: 0 } as ITransactionData)).toThrow(TransactionSchemaError);
        });
    });

    describe(".fromJson", () => {
        it("should pass to create a transaction from JSON", () => {
            expectTransaction(TransactionFactory.fromJson(transactionJson));
        });

        it("should fail to create a transaction from JSON that contains malformed data", () => {
            expect(() =>
                TransactionFactory.fromJson({
                    ...transactionJson,
                    ...{ senderPublicKey: "something" },
                }),
            ).toThrowError(TransactionSchemaError);
        });
    });
});
