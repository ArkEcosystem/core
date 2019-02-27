import { MemPoolTransaction } from "../../../packages/core-transaction-pool/src/mem-pool-transaction";
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
            const storage = new Storage("./tmp");
            const memPoolTransaction = new MemPoolTransaction(transactions.dummy1);
            storage.bulkAdd([memPoolTransaction]);

            expect(mockPrepare).toHaveBeenLastCalledWith("ROLLBACK;");

            jest.unmock("better-sqlite3");
        });
    });
});
