import "../../../mocks/core-container";

import { blockchain } from "../../../mocks/blockchain";
import { database } from "../../../mocks/database";

import { Blocks, Crypto } from "@arkecosystem/crypto";
import { acceptNewPeer } from "../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import {
    getBlocks,
    getCommonBlocks,
    getPeers,
    getStatus,
    postBlock,
    postTransactions,
} from "../../../../../../packages/core-p2p/src/socket-server/versions/peer";
import { createPeerService } from "../../../../../helpers/peers";
import { blocks2to100 } from "../../../../../utils/fixtures/testnet/blocks2to100";

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
            const { service, processor } = createPeerService();
            processor.validateAndAcceptPeer = jest.fn();

            await acceptNewPeer({
                service,
                req: {
                    data: { ip: "127.0.0.1" },
                    headers: {},
                },
            });

            expect(processor.validateAndAcceptPeer).toHaveBeenCalledTimes(1);
        });
    });

    describe("getPeers", () => {
        it("should return the peers", () => {
            const { service, storage } = createPeerService();

            storage.getPeers = jest.fn().mockReturnValue([
                {
                    toBroadcast: jest.fn().mockReturnValue({ latency: 1 }),
                },
            ]);

            expect(getPeers({ service })).toEqual([{ latency: 1 }]);
        });
    });

    describe("getCommonBlocks", () => {
        it("should return common blocks", async () => {
            database.getCommonBlocks = jest.fn().mockReturnValue(["12345"]);

            const result = await getCommonBlocks({
                req: {
                    data: { ids: ["12345"] },
                },
            });

            expect(result).toEqual({
                common: "12345",
                lastBlockHeight: 1,
            });
        });
    });

    describe("getStatus", () => {
        it("should return status", async () => {
            Crypto.Slots.isForgingAllowed = jest.fn().mockReturnValue(true);
            Crypto.Slots.getSlotNumber = jest.fn().mockReturnValue(3);

            const result = await getStatus();

            expect(result.state).toEqual({
                height: 1,
                forgingAllowed: true,
                currentSlot: 3,
                header: {},
            });
        });
    });

    describe("postBlock", () => {
        it("should handle the incoming block with ipv4", async () => {
            const result = await postBlock({
                req: {
                    headers: { remoteAddress: "127.0.0.1" },
                    data: {
                        block: Blocks.Serializer.serializeWithTransactions(blocks2to100[0]),
                    },
                },
            });

            expect(result).toBeUndefined();
        });

        it("should handle the incoming block with ipv6", async () => {
            const result = await postBlock({
                req: {
                    headers: { remoteAddress: "::ffff:127.0.0.1" },
                    data: {
                        block: Blocks.Serializer.serializeWithTransactions(blocks2to100[0]),
                    },
                },
            });

            expect(result).toBeUndefined();
        });
    });

    // @TODO: this is an integration test, not a unit test
    describe.skip("postTransactions", () => {
        it("should handle the incoming transactions", async () => {
            const result = await postTransactions({
                service: createPeerService().service,
                req: {
                    data: {
                        transactions: [{}],
                    },
                },
            });

            expect(result).toEqual([]);
        });
    });

    describe.skip("getBlocks", () => {
        // TODO also test with something like {lastBlockHeight: 1}
        it("should return the blocks", async () => {
            const result = await getBlocks({
                req: {
                    data: {},
                    headers: { remoteAddress: "127.0.0.1" },
                },
            });

            expect(result).toEqual([blockchain.getLastBlock().data]);
        });
    });
});
