import { constants } from "@arkecosystem/crypto";
import { MemPoolTransaction } from "../../../packages/core-transaction-pool/src/mem-pool-transaction";
import { transactions } from "./__fixtures__/transactions";

describe("MemPoolTransaction", () => {
    describe("expireAt", () => {
        it("should return transaction expiration when it is set", () => {
            const transaction = transactions.dummy1;
            transaction.expiration = 1123;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(1)).toBe(1123);
        });

        it("should return timestamp + maxTransactionAge when expiration is not set", () => {
            const transaction = transactions.dummy2;
            transaction.timestamp = 344;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(131)).toBe(transaction.timestamp + 131);
        });

        it("should return null for timelock transfer with no expiration set", () => {
            const transaction = transactions.dummy3;
            transaction.type = constants.TransactionTypes.TimelockTransfer;
            const memPoolTransaction = new MemPoolTransaction(transaction);
            expect(memPoolTransaction.expireAt(1)).toBe(null);
        });
    });
});
