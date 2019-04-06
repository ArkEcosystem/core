import "../../../mocks/core-container";

import { blockchain } from "../../../mocks/blockchain";
import { database } from "../../../mocks/database";
import { getStorage } from "../../../mocks/p2p/peer-storage";

import { slots } from "@arkecosystem/crypto";
import { makePeerService } from "../../../../../../packages/core-p2p/src/plugin";
import {
    acceptNewPeer,
    getBlocks,
    getCommonBlocks,
    getPeers,
    getStatus,
    postBlock,
    postTransactions,
} from "../../../../../../packages/core-p2p/src/socket-server/versions/peer";
import { block2 } from "../../../../../utils/fixtures/unitnet/blocks";

jest.mock("@arkecosystem/core-transaction-pool", () => {
    return {
        // tslint:disable-next-line
        TransactionGuard: function() {
            return {
                validate: () => ({
                    invalid: [],
                    broadcast: [],
                    accept: [],
                }),
            };
        },
    };
});

jest.mock("../../../../../../packages/core-p2p/src/socket-server/utils/validate");

describe("Peers handler", () => {
    describe("acceptNewPeer", () => {
        it("should call monitor acceptNewPeer", async () => {
            const service = makePeerService();
            service.getProcessor().validateAndAcceptPeer = jest.fn();

            await acceptNewPeer(service, {
                data: { ip: "0.0.0.0" },
                headers: {},
            });

            expect(service.getProcessor().validateAndAcceptPeer).toHaveBeenCalledTimes(1);
        });
    });

    describe("getPeers", () => {
        it("should return the peers", () => {
            const service = makePeerService();
            service.getStorage().getPeers = jest.fn().mockReturnValue([
                {
                    toBroadcast: jest.fn().mockReturnValue({ delay: 1 }),
                },
            ]);
            const result = getPeers(service);
            expect(result).toEqual({
                success: true,
                peers: [{ delay: 1 }],
            });
        });
    });

    describe("getCommonBlocks", () => {
        it("should return common blocks", async () => {
            database.getCommonBlocks = jest.fn().mockReturnValue(["12345"]);
            const result = await getCommonBlocks(makePeerService(), {
                data: { ids: ["12345"] },
            });
            expect(result).toEqual({
                success: true,
                common: "12345",
                lastBlockHeight: 1,
            });
        });
    });

    describe("getStatus", () => {
        it("should return status", () => {
            slots.isForgingAllowed = jest.fn().mockReturnValue(true);
            slots.getSlotNumber = jest.fn().mockReturnValue(3);

            const result = getStatus();

            expect(result).toEqual({
                success: true,
                height: 1,
                forgingAllowed: true,
                currentSlot: 3,
                header: {},
            });
        });
    });

    describe("postBlock", () => {
        it("should handle the incoming block", () => {
            const result = postBlock(makePeerService(), {
                headers: { remoteAddress: "0.0.0.0" },
                data: {
                    block: block2,
                },
            });

            expect(result).toEqual({
                success: true,
            });
        });
    });

    describe("postTransactions", () => {
        it("should handle the incoming transactions", async () => {
            const result = await postTransactions(makePeerService(), {
                data: {
                    transactions: [{}],
                },
            });

            expect(result).toEqual({
                success: true,
                transactionIds: [],
            });
        });
    });

    describe("getBlocks", () => {
        // TODO also test with something like {lastBlockHeight: 1}
        it("should return the blocks", async () => {
            const result = await getBlocks(makePeerService(), {
                data: {},
                headers: { remoteAddress: "0.0.0.0" },
            });

            expect(result).toEqual({
                success: true,
                blocks: [blockchain.getLastBlock().data],
            });
        });
    });
});
