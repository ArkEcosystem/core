import { SequentialTransaction } from "../../../packages/core-transaction-pool/src/sequential-transaction";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { transactions } from "./__fixtures__/transactions";

describe("Storage", () => {
    const storage = new Storage();

    beforeEach(() => {
        storage.connect("./tmp");
        storage.deleteAll();
    });

    afterAll(() => {
        storage.deleteAll();
        storage.disconnect();
    });

    describe("bulkAdd", () => {
        it("should add the transactions provided", () => {
            const memPoolTransactions = [
                new SequentialTransaction(transactions.dummy1),
                new SequentialTransaction(transactions.dummy2),
            ];

            storage.bulkAdd(memPoolTransactions);
            const allSequentialTransactions = storage.loadAll();
            expect(allSequentialTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });

    describe("bulkRemoveById", () => {
        it("should remove the transactions corresponding to the ids provided", () => {
            const memPoolTransactions = [
                new SequentialTransaction(transactions.dummy1),
                new SequentialTransaction(transactions.dummy2),
            ];
            const anotherSequentialTransaction = new SequentialTransaction(transactions.dummy3);

            storage.bulkAdd([...memPoolTransactions, anotherSequentialTransaction]);
            storage.bulkRemoveById([transactions.dummy3.id]);
            const allSequentialTransactions = storage.loadAll();
            expect(allSequentialTransactions.map(pooltx => pooltx.transaction)).toMatchObject(
                memPoolTransactions.map(pooltx => pooltx.transaction),
            );
        });
    });
});
