import { MemoryTransaction } from "../../../packages/core-transaction-pool/src/memory-transaction";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { transactions } from "./__fixtures__/transactions";

// first mock the whole better-sqlite3 module to be able to control 'inTransaction' prop
const mockPrepare = jest.fn().mockImplementation(str => ({
    run: () => true,
    all: () => [],
}));
jest.mock("better-sqlite3", () => {
    // tslint:disable-next-line:only-arrow-functions
    return function(file) {
        return {
            inTransaction: true,
            prepare: mockPrepare,
            exec: () => true,
        };
    };
});

describe("Storage", () => {
    describe("bulkAdd", () => {
        it("should rollback if this.db is 'inTransaction'", () => {
            const storage = new Storage();
            storage.connect("./tmp");

            const memPoolTransaction = new MemoryTransaction(transactions.dummy1);
            storage.bulkAdd([memPoolTransaction]);

            expect(mockPrepare).toHaveBeenLastCalledWith("ROLLBACK;");

            jest.unmock("better-sqlite3");
        });
    });
});
