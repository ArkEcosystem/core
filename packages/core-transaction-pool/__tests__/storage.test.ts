import { MemPoolTransaction } from "../src/mem-pool-transaction";
import { Storage } from "../src/storage";
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
                new MemPoolTransaction(transactions.dummy1),
                new MemPoolTransaction(transactions.dummy2),
            ];

            storage.bulkAdd(memPoolTransactions);
            const allMemPoolTransactions = storage.loadAll();
            expect(allMemPoolTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });

    describe("bulkRemoveById", () => {
        it("should remove the transactions corresponding to the ids provided", () => {
            const memPoolTransactions = [
                new MemPoolTransaction(transactions.dummy1),
                new MemPoolTransaction(transactions.dummy2),
            ];
            const anotherMemPoolTransaction = new MemPoolTransaction(transactions.dummy3);

            storage.bulkAdd([...memPoolTransactions, anotherMemPoolTransaction]);
            storage.bulkRemoveById([transactions.dummy3.id]);
            const allMemPoolTransactions = storage.loadAll();
            expect(allMemPoolTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });
});
