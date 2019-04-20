import { MemoryTransaction } from "../../../packages/core-transaction-pool/src/memory-transaction";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { transactions } from "./__fixtures__/transactions";

describe("Storage", () => {
    const storage = new Storage("./tmp");

    beforeEach(() => storage.deleteAll());
    afterAll(() => {
        storage.deleteAll();
        storage.close();
    });

    describe("bulkAdd", () => {
        it("should add the transactions provided", () => {
            const memPoolTransactions = [
                new MemoryTransaction(transactions.dummy1),
                new MemoryTransaction(transactions.dummy2),
            ];

            storage.bulkAdd(memPoolTransactions);
            const allMemoryTransactions = storage.loadAll();
            expect(allMemoryTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });

    describe("bulkRemoveById", () => {
        it("should remove the transactions corresponding to the ids provided", () => {
            const memPoolTransactions = [
                new MemoryTransaction(transactions.dummy1),
                new MemoryTransaction(transactions.dummy2),
            ];
            const anotherMemoryTransaction = new MemoryTransaction(transactions.dummy3);

            storage.bulkAdd([...memPoolTransactions, anotherMemoryTransaction]);
            storage.bulkRemoveById([transactions.dummy3.id]);
            const allMemoryTransactions = storage.loadAll();
            expect(allMemoryTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });
});
