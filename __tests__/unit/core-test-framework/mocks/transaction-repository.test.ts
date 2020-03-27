import "jest-extended";

import { TransactionRepository } from "@packages/core-test-framework/src/mocks";
import { Models } from "@packages/core-database";
import { SearchOperator } from "@packages/core-database/src/repositories/search";

let transaction: Partial<Models.Transaction> = {
    id: "0c79fe9faf214de92847baa322a9e991a49f6f6f0bc774927098c7feae627d77",
    blockId: "6749a4b976e792817d32e1cf06d6b303badd2a5aff3086cc682349b9029290d5",
    version: 2,
    type: 2,
    typeGroup: 1,
    amount: BigInt("0"),
    fee: BigInt("2500000000"),
    senderPublicKey: "0272a9fb36e7a7d212aedfab53b2cdd48c8b620583d1927e03104122e6792482db",
    recipientId: "DRwgqrfuuaPCy3AE8Sz1AjdrncKfHjePn5",
};

const feeStatistics: TransactionRepository.FeeStatistics = {
    type: 1,
    typeGroup: 1,
    avg: "15",
    min: "10",
    max: "20",
    sum: "500",
};

const clear = () => {
    TransactionRepository.setTransaction(undefined);
    TransactionRepository.setTransactions([]);
    TransactionRepository.setFeeStatistics([]);
};

describe("TransactionRepository", () => {
    describe("default values", () => {
        it("findById should return empty search result", async () => {
            await expect(TransactionRepository.instance.findById("dummy_id")).resolves.toBeUndefined();
        });

        it("findByIdAndType should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByIdAndType(1, "dummy_id")).resolves.toBeUndefined();
        });

        it("search should return empty search result", async () => {
            await expect(TransactionRepository.instance.search({ criteria: [] })).resolves.toEqual({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });
        });

        it("searchByQuery should return empty search result", async () => {
            await expect(TransactionRepository.instance.searchByQuery({}, { limit: 100, offset: 0 })).resolves.toEqual({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });
        });

        it("findByIds should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByIds(["dummy_id"])).resolves.toEqual([]);
        });

        it("findByType should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByType(1, 1)).resolves.toEqual([]);
        });

        it("findReceivedTransactions should return empty search result", async () => {
            await expect(TransactionRepository.instance.findReceivedTransactions()).resolves.toEqual([]);
        });

        it("findByHtlcLocks should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByHtlcLocks(["dummy_id"])).resolves.toEqual([]);
        });

        it("getOpenHtlcLocks should return empty search result", async () => {
            await expect(TransactionRepository.instance.getOpenHtlcLocks()).resolves.toEqual([]);
        });

        it("getClaimedHtlcLockBalances should return empty search result", async () => {
            await expect(TransactionRepository.instance.getClaimedHtlcLockBalances()).resolves.toEqual([]);
        });

        it("getRefundedHtlcLockBalances should return empty search result", async () => {
            await expect(TransactionRepository.instance.getRefundedHtlcLockBalances()).resolves.toEqual([]);
        });

        it("getFeeStatistics should return empty search result", async () => {
            await expect(TransactionRepository.instance.getFeeStatistics(1)).resolves.toEqual([]);
        });
    });

    describe("setTransaction", () => {
        beforeEach(() => {
            clear();

            TransactionRepository.setTransaction(transaction);
        });

        it("findByIdAndType should return mocked transaction", async () => {
            await expect(TransactionRepository.instance.findByIdAndType(1, "dummy_id")).resolves.toEqual(transaction);
        });

        it("findById should return mocked transaction", async () => {
            await expect(TransactionRepository.instance.findById("dummy_id")).resolves.toEqual(transaction);
        });
    });

    describe("setMockTransactions", () => {
        beforeEach(() => {
            clear();

            TransactionRepository.setTransactions([transaction]);
        });

        it("search should return search result with transaction", async () => {
            await expect(TransactionRepository.instance.search({ criteria: [] })).resolves.toEqual({
                rows: [transaction],
                count: 1,
                countIsEstimate: false,
            });
        });

        it("search should return search result with filtered transaction", async () => {
            await expect(
                TransactionRepository.instance.search({
                    criteria: [{ field: "type", value: 2, operator: SearchOperator.Equal }],
                }),
            ).resolves.toEqual({
                rows: [transaction],
                count: 1,
                countIsEstimate: false,
            });
        });

        it("search should return empty search result with filtered transaction", async () => {
            await expect(
                TransactionRepository.instance.search({
                    criteria: [{ field: "type", value: 3, operator: SearchOperator.Equal }],
                }),
            ).resolves.toEqual({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });
        });

        it("searchByQuery should return empty search result", async () => {
            await expect(TransactionRepository.instance.searchByQuery({}, { limit: 100, offset: 0 })).resolves.toEqual({
                rows: [transaction],
                count: 1,
                countIsEstimate: false,
            });
        });

        it("findByIds should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByIds(["dummy_id"])).resolves.toEqual([transaction]);
        });

        it("findByType should return empty search result", async () => {
            await expect(TransactionRepository.instance.findByIds(["dummy_id"])).resolves.toEqual([transaction]);
        });

        it("findReceivedTransactions should return empty search result", async () => {
            await expect(TransactionRepository.instance.findReceivedTransactions()).resolves.toEqual([
                {
                    recipientId: transaction.recipientId,
                    amount: transaction.amount!.toString(),
                },
            ]);
        });

        it("findByHtlcLocks should return mocked transactions", async () => {
            await expect(TransactionRepository.instance.findByHtlcLocks(["dummy_id"])).resolves.toEqual([transaction]);
        });

        it("getOpenHtlcLocks should return empty search result", async () => {
            await expect(TransactionRepository.instance.getOpenHtlcLocks()).resolves.toEqual([transaction]);
        });

        it("getClaimedHtlcLockBalances should return empty search result", async () => {
            await expect(TransactionRepository.instance.getClaimedHtlcLockBalances()).resolves.toEqual([
                {
                    recipientId: transaction.recipientId,
                    amount: transaction.amount!.toString(),
                },
            ]);
        });

        it("getRefundedHtlcLockBalances should return empty search result", async () => {
            await expect(TransactionRepository.instance.getRefundedHtlcLockBalances()).resolves.toEqual([
                {
                    senderPublicKey: transaction.senderPublicKey,
                    amount: transaction.amount!.toString(),
                },
            ]);
        });
    });

    describe("setFeeStatistics", () => {
        beforeEach(() => {
            clear();

            TransactionRepository.setFeeStatistics([feeStatistics]);
        });

        it("findByIdAndType should return mocked transaction", async () => {
            await expect(TransactionRepository.instance.getFeeStatistics(1)).resolves.toEqual([feeStatistics]);
        });
    });
});
