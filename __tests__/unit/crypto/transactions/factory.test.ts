import "jest-extended";

import { Interfaces, Utils } from "@arkecosystem/crypto";
import { MalformedTransactionBytesError, TransactionSchemaError } from "../../../../packages/crypto/src/errors";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Serializer, TransactionFactory } from "../../../../packages/crypto/src/transactions";
import { transaction as transactionFixture } from "../fixtures/transaction";

function expectTransaction({ data }): void {
    expect(data).toEqual(transactionFixture);
}

beforeEach(() => configManager.setFromPreset("devnet"));

const transaction: Interfaces.ITransaction = TransactionFactory.fromData(transactionFixture);
const transactionJson: Interfaces.ITransactionJson = transaction.toJson();
const transactionSerialized: Buffer = Serializer.serialize(transaction);

describe("TransactionFactory", () => {
    describe(".fromHex", () => {
        it("should pass to create a transaction from hex", () => {
            expectTransaction(TransactionFactory.fromHex(transactionSerialized.toString("hex")));
        });

        it("should fail to create a transaction from hex that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromHex("deadbeef")).toThrowError(MalformedTransactionBytesError);
        });
    });

    describe(".fromBytes", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(TransactionFactory.fromBytes(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromBytes(Buffer.from("deadbeef"))).toThrowError(
                MalformedTransactionBytesError,
            );
        });
    });

    describe(".fromBytesUnsafe", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(TransactionFactory.fromBytesUnsafe(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactory.fromBytesUnsafe(Buffer.from("deadbeef"))).toThrowError(
                MalformedTransactionBytesError,
            );
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
    });

    describe(".fromJson", () => {
        it("should pass to create a transaction from JSON", () => {
            expectTransaction(TransactionFactory.fromJson(transactionJson));
        });

        it("should fail to create a transaction from JSON that contains malformed data", () => {
            expect(() =>
                TransactionFactory.fromJson({
                    ...transactionJson,
                    ...{ fee: "something" },
                }),
            ).toThrowError(TransactionSchemaError);
        });
    });
});
