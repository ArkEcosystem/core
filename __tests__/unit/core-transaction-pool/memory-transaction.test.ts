import { Enums, Interfaces } from "@arkecosystem/crypto";
import { MemoryTransaction } from "../../../packages/core-transaction-pool/src/memory-transaction";
import { transactions } from "./__fixtures__/transactions";

describe("MemoryTransaction", () => {
    describe("expiresAt", () => {
        it("should return transaction expiration when it is set", () => {
            const transaction: Interfaces.ITransaction = transactions.dummy1;
            transaction.data.expiration = 1123;
            const memPoolTransaction = new MemoryTransaction(transaction);
            expect(memPoolTransaction.expiresAt(1)).toBe(1123);
        });

        it("should return timestamp + maxTransactionAge when expiration is not set", () => {
            const transaction: Interfaces.ITransaction = transactions.dummy2;
            transaction.data.timestamp = 344;
            const memPoolTransaction = new MemoryTransaction(transaction);
            expect(memPoolTransaction.expiresAt(131)).toBe(transaction.data.timestamp + 131);
        });

        it("should return null for timelock transfer with no expiration set", () => {
            const transaction: Interfaces.ITransaction = transactions.dummy3;
            transaction.data.type = Enums.TransactionTypes.TimelockTransfer;
            const memPoolTransaction = new MemoryTransaction(transaction);
            expect(memPoolTransaction.expiresAt(1)).toBe(null);
        });
    });
});
