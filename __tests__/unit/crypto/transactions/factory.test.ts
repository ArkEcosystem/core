import "jest-extended";

import { Interfaces } from "@arkecosystem/crypto";
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
        it("should create a transaction instance from hex", () => {
            expectTransaction(TransactionFactory.fromHex(transactionSerialized.toString("hex")));
        });
    });

    describe(".fromBytes", () => {
        it("should create a transaction instance from a buffer", () => {
            expectTransaction(TransactionFactory.fromBytes(transactionSerialized));
        });
    });

    describe(".fromBytesUnsafe", () => {
        it("should create a transaction instance from a buffer (unsafe)", () => {
            expectTransaction(TransactionFactory.fromBytesUnsafe(transactionSerialized));
        });
    });

    describe(".fromData", () => {
        it("should create a transaction instance from an object", () => {
            expectTransaction(TransactionFactory.fromData(transaction.data));
        });
    });

    describe(".fromJson", () => {
        it("should create a transaction instance from JSON", () => {
            expectTransaction(TransactionFactory.fromJson(transactionJson));
        });
    });
});
