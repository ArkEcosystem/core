import { blockchain } from "../../../../mocks/blockchain";
import "../../../../mocks/core-container";
import { database } from "../../../../mocks/database";

import { Transaction } from "@arkecosystem/crypto";
import {
    getUnconfirmedTransactions,
    verifyTransaction,
} from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/transactions";

import { makePeerService } from "../../../../../../../packages/core-p2p/src/plugin";
import genesisBlockJSON from "../../../../../../utils/config/unitnet/genesisBlock.json";

jest.mock("../../../../../../../packages/core-p2p/src/socket-server/utils/validate");

describe("Internal handlers - transactions", () => {
    describe("verifyTransaction", () => {
        it("should return 'valid' object when transaction is valid", async () => {
            database.verifyTransaction = jest.fn().mockReturnValue(true);
            const req = {
                data: {
                    transaction: Transaction.toBytes(genesisBlockJSON.transactions[0]),
                },
            };
            const result = await verifyTransaction(makePeerService(), req);
            expect(result).toEqual({
                data: {
                    valid: true,
                },
            });
        });

        it("should return 'invalid' object when transaction is invalid", async () => {
            database.verifyTransaction = jest.fn().mockReturnValue(false);
            const req = {
                data: {
                    transaction: Transaction.toBytes(genesisBlockJSON.transactions[0]),
                },
            };
            const result = await verifyTransaction(makePeerService(), req);
            expect(result).toEqual({
                data: {
                    valid: false,
                },
            });
        });
    });

    describe("getUnconfirmedTransactions", () => {
        it("should return unconfirmed transactions", () => {
            blockchain.getUnconfirmedTransactions = jest.fn().mockReturnValue(["111"]);
            const result = getUnconfirmedTransactions();
            expect(result).toEqual({
                data: ["111"],
            });
        });
    });
});
