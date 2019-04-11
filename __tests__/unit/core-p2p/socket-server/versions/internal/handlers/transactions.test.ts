import "../../../../mocks/core-container";

import { blockchain } from "../../../../mocks/blockchain";

import { getUnconfirmedTransactions } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";

jest.mock("../../../../../../../packages/core-p2p/src/socket-server/utils/validate");

describe("Internal handlers - transactions", () => {
    describe("getUnconfirmedTransactions", () => {
        it("should return unconfirmed transactions", () => {
            blockchain.getUnconfirmedTransactions = jest.fn().mockReturnValue(["111"]);
            const result = getUnconfirmedTransactions();
            expect(result).toEqual(["111"]);
        });
    });
});
