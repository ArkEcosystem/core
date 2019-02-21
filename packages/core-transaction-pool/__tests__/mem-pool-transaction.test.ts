import { constants, Transaction } from "@arkecosystem/crypto";
import { MemPoolTransaction } from "../src/mem-pool-transaction";
import { transactions } from "./__fixtures__/transactions";

describe("MemPoolTransaction", () => {
    describe("expireAt", () => {
        it("should return transaction expiration when it is set", () => {
            const transaction: Transaction = transactions.dummy1;
            transaction.data.expiration = 1123;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(1)).toBe(1123);
        });

        it("should return timestamp + maxTransactionAge when expiration is not set", () => {
            const transaction: Transaction = transactions.dummy2;
            transaction.data.timestamp = 344;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(131)).toBe(transaction.data.timestamp + 131);
        });

        it("should return null for timelock transfer with no expiration set", () => {
            const transaction: Transaction = transactions.dummy3;
            transaction.data.type = constants.TransactionTypes.TimelockTransfer;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(1)).toBe(null);
        });
    });
});
