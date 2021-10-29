import "jest-extended";

import { TransactionPoolQuery } from "@packages/core-test-framework/src/mocks";
import { Interfaces } from "@packages/crypto";

let tranasction: Partial<Interfaces.ITransaction> = {
    id: "f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177",
    type: 2,
    typeGroup: 1,
};

const clear = () => {
    TransactionPoolQuery.setTransactions([]);
};

describe("TransactionPoolQuery", () => {
    describe("default values", () => {
        it("getFromHighestPriority should return", async () => {
            expect(TransactionPoolQuery.instance.getFromHighestPriority()).toEqual({ transactions: [] });
        });
    });

    describe("setTransactions", () => {
        beforeEach(() => {
            clear();

            TransactionPoolQuery.setTransactions([tranasction]);
        });

        it("getPeers should return mocked peer", async () => {
            expect(TransactionPoolQuery.instance.getFromHighestPriority()).toEqual({ transactions: [tranasction] });
        });
    });

    describe("CustomQueryIterable", () => {
        let customQueryIterable: TransactionPoolQuery.CustomQueryIterable;

        beforeEach(() => {
            customQueryIterable = new TransactionPoolQuery.CustomQueryIterable([tranasction]);
        });

        it("whereId should return all transactions", async () => {
            expect(customQueryIterable.whereId(1)).toEqual({ transactions: [tranasction] });
        });

        it("has should return true if transactions exist", async () => {
            expect(customQueryIterable.has()).toBeTrue();
        });

        it("first should return first transaction", async () => {
            expect(customQueryIterable.first()).toEqual(tranasction);
        });

        it("should iterate", async () => {
            expect(Array.from(customQueryIterable.whereId(1))).toEqual([tranasction]);
        });
    });
});
