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
            const memPoolTransactions = [ transactions.dummy1, transactions.dummy2 ];

            storage.bulkAdd(memPoolTransactions);
            const allTransactions = storage.loadAll();
            expect(allTransactions).toMatchObject(memPoolTransactions);
        });
    });

    describe("bulkRemoveById", () => {
        it("should remove the transactions corresponding to the ids provided", () => {
            const memPoolTransactions = [ transactions.dummy1, transactions.dummy2 ];
            const anotherTransaction = transactions.dummy3;

            storage.bulkAdd([...memPoolTransactions, anotherTransaction]);
            storage.bulkRemoveById([ anotherTransaction.id ]);
            const allTransactions = storage.loadAll();
            expect(allTransactions).toMatchObject(memPoolTransactions);
        });
    });
});
