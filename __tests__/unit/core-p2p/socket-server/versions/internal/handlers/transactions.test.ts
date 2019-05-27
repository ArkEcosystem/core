import "../../../../mocks/core-container";

import { transactionPool } from "../../../../mocks/transaction-pool";

import { getUnconfirmedTransactions } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";

jest.mock("../../../../../../../packages/core-p2p/src/socket-server/utils/validate");

describe("Internal handlers - transactions", () => {
    describe("getUnconfirmedTransactions", () => {
        it("should return unconfirmed transactions", () => {
            transactionPool.getTransactionsForForging = jest.fn().mockReturnValue(["111"]);
            transactionPool.getPoolSize = jest.fn().mockReturnValue(1);

            expect(getUnconfirmedTransactions()).toEqual({ count: 1, poolSize: 1, transactions: ["111"] });
        });
    });
});
