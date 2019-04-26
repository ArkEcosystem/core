import { TransactionStore } from "../../../../packages/core-state/src/stores/transactions";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";

describe("TransactionStore", () => {
    it("should push and get a transaction", () => {
        const transaction = genesisBlock.transactions[0];

        const store = new TransactionStore(100);
        store.push(transaction);

        expect(store.count()).toBe(1);
        expect(store.get(transaction.id)).toEqual(transaction);
    });
});
