import { blockchain } from "./mocks/blockchain";
import "./mocks/core-container";
import { logger } from "./mocks/logger";
import { state } from "./mocks/state";

import { slots } from "@arkecosystem/crypto";
import fs from "fs";
import { monitor } from "../../../packages/core-p2p/src/monitor";
import { NetworkState } from "../../../packages/core-p2p/src/network-state";

jest.mock("../../../packages/core-p2p/src/utils/check-dns", () => ({
    checkDNS: jest.fn().mockReturnValue("dnshost"),
}));
jest.mock("../../../packages/core-p2p/src/utils/check-ntp", () => ({
    checkNTP: jest.fn().mockReturnValue({ host: "ntphost", time: { t: 10 } }),
}));
jest.mock("../../../packages/core-p2p/src/peer");
jest.mock("fs");

describe("Monitor", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("start", () => {
        it("should start without error and set blockchain forceWakeup", async () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            const acceptNewPeer = jest.spyOn(monitor, "acceptNewPeer");
            jest.spyOn(localConfig, "get").mockReturnValue([]);
            jest.spyOn(monitor, "validatePeer").mockReturnValueOnce(true);

            await monitor.start({
                networkStart: false,
            });

            expect(acceptNewPeer).toHaveBeenCalledWith({ ...peerMock, version: "2.3.0" }, expect.any(Object));

            acceptNewPeer.mockRestore();
        });
    });

    describe("acceptNewPeer", () => {
        it("should accept the peer", async () => {
            const peerMock = { ip: "2.3.4.5", port: 4000 };
            monitor.config = { disableDiscovery: false };
            (monitor.guard as any) = {
                isSuspended: jest.fn().mockReturnValue(false),
                isBlacklisted: jest.fn().mockReturnValue(false),
                isValidVersion: jest.fn().mockReturnValue(true),
                isWhitelisted: jest.fn().mockReturnValue(false),
                isValidNetwork: jest.fn().mockReturnValue(true),
                suspend: jest.fn(),
            };

            await monitor.acceptNewPeer(peerMock, { seed: false, lessVerbose: false });

            expect(logger.debug).toHaveBeenCalledWith("Accepted new peer undefined:undefined");
            // undefined:undefined because of peer default jest mock
        });

        test.todo("should suspend the peer - blacklisted");

        test.todo("should suspend the peer - isValidVersion false");

        test.todo("should suspend the peer - isValidNetwork false");

        test.todo("should not accept the peer - ping failed");
    });

    describe("removePeer", () => {
        it("should remove the peer", () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            monitor.peers = { [peerMock.ip]: peerMock };

            monitor.removePeer(peerMock);

            expect(monitor.peers).toEqual({});
        });
    });

    describe("cleanPeers", () => {
        it("should remove the unresponsive peers", async () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            monitor.peers = { [peerMock.ip]: peerMock };
            const mockGetPeer = jest.spyOn(monitor, "getPeer").mockReturnValue({
                ...peerMock,
                ping: jest.fn().mockImplementation(() => {
                    throw new Error("yo");
                }),
            } as any);

            await monitor.cleanPeers();

            expect(monitor.peers).toEqual({});

            mockGetPeer.mockRestore();
        });
    });

    describe("suspendPeer", () => {
        it("should suspend the peer from ip provided", async () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            monitor.peers = { [peerMock.ip]: peerMock };

            (monitor.guard as any) = {
                isSuspended: jest.fn().mockReturnValue(false),
                suspend: jest.fn(),
            };

            await monitor.suspendPeer(peerMock.ip);

            expect(monitor.guard.suspend).toHaveBeenCalledWith(peerMock);
        });
    });

    describe("getSuspendedPeers", () => {
        it("should get the suspended peers from guard.all()", () => {
            (monitor.guard as any) = {
                all: jest.fn().mockReturnValue(["peer1"]),
            };

            const suspendedPeers = monitor.getSuspendedPeers();

            expect(suspendedPeers).toEqual(["peer1"]);
        });
    });

    describe("getPeers", () => {
        it("should get the peers", () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            monitor.peers = { [peerMock.ip]: peerMock };

            const peers = monitor.getPeers();

            expect(peers).toEqual([peerMock]);
        });
    });

    describe("getPeer", () => {
        it("should get the peer", () => {
            const peerMock = { ip: "1.2.3.4", port: 4000 };
            monitor.peers = { [peerMock.ip]: peerMock };

            const peer = monitor.getPeer(peerMock.ip);

            expect(peer).toEqual(peerMock);
        });
    });

    describe("discoverPeers", () => {
        it("should populate list of available peers from existing peers", async () => {
            const peerMock = {
                ip: "1.2.3.4",
                port: 4000,
                getPeers: jest.fn().mockReturnValue([{ ip: "1.1.1.1" }, { ip: "2.2.2.2" }]),
            };
            monitor.peers = { [peerMock.ip]: peerMock };
            monitor.config = { ignoreMinimumNetworkReach: true };
            const acceptNewPeer = jest.spyOn(monitor, "acceptNewPeer");
            const validatePeer = jest.spyOn(monitor, "validatePeer").mockReturnValue(true);

            await monitor.discoverPeers();

            expect(acceptNewPeer).toHaveBeenCalledTimes(2);
            expect(acceptNewPeer).toHaveBeenCalledWith({ ip: "1.1.1.1" }, { lessVerbose: true });
            expect(acceptNewPeer).toHaveBeenCalledWith({ ip: "2.2.2.2" }, { lessVerbose: true });
            validatePeer.mockRestore();
        });
    });

    describe("hasPeers", () => {
        it("should return true when it has peers", () => {
            const peerMock = {
                ip: "1.2.3.4",
                port: 4000,
            };
            monitor.peers = { [peerMock.ip]: peerMock };

            expect(monitor.hasPeers()).toBe(true);
        });

        it("should return false when it has no peer", () => {
            monitor.peers = {};

            expect(monitor.hasPeers()).toBe(false);
        });
    });

    describe("getNetworkHeight", () => {
        it("should return correct network height", () => {
            monitor.peers = {
                "1.1.1.1": { state: { height: 1 } },
                "1.1.1.2": { state: { height: 7 } },
                "1.1.1.3": { state: { height: 10 } },
            };

            expect(monitor.getNetworkHeight()).toBe(7);
        });
    });

    describe("getPBFTForgingStatus", () => {
        it("should return correct pbft data", () => {
            monitor.peers = {
                "1.1.1.1": { state: { height: 1, currentSlot: 2, forgingAllowed: true } },
                "1.1.1.2": { state: { height: 7, currentSlot: 2, forgingAllowed: true } },
                "1.1.1.3": { state: { height: 10, currentSlot: 2, forgingAllowed: true } },
            };
            jest.spyOn(slots, "getSlotNumber").mockReturnValue(2);

            expect(monitor.getPBFTForgingStatus()).toBe(2 / 3);
        });
        test.todo("more cases need to be covered, see pbft calculation");
    });

    describe("getNetworkState", () => {
        it("should return network state from NetworkState.analyze", async () => {
            monitor.peers = {};
            const networkState = { nodeHeight: 333 };
            jest.spyOn(NetworkState, "analyze").mockReturnValue(networkState as any);

            expect(await monitor.getNetworkState()).toEqual(networkState);
        });
    });

    describe("refreshPeersAfterFork", () => {
        it("should reset the suspended peers and suspend the peer causing the fork", async () => {
            monitor.peers = {};
            (monitor.guard as any) = {
                resetSuspendedPeers: jest.fn(),
            };
            const suspendPeer = jest.spyOn(monitor, "suspendPeer");
            state.forkedBlock = { ip: "1.1.1.1" };

            await monitor.refreshPeersAfterFork();
            expect(monitor.guard.resetSuspendedPeers).toHaveBeenCalled();
            expect(suspendPeer).toHaveBeenCalledWith("1.1.1.1");
        });
    });

    describe("downloadBlocks", () => {
        it("should download blocks from random peer", async () => {
            const mockBlock = { id: "123456" };
            monitor.peers = {
                "1.1.1.1": {
                    ip: "1.1.1.1",
                    state: {
                        height: 1,
                        currentSlot: 2,
                        forgingAllowed: true,
                    },
                    ban: 0,
                    verification: {
                        forked: false,
                    },
                    downloadBlocks: jest.fn().mockReturnValue([mockBlock]),
                },
            };

            expect(await monitor.downloadBlocks(1)).toEqual([{ ...mockBlock, ip: "1.1.1.1" }]);
        });
    });

    describe("broadcastBlock", () => {
        it("should broadcast the block to peers", async () => {
            monitor.peers = {
                "1.1.1.1": {
                    postBlock: jest.fn(),
                },
            };
            blockchain.getBlockPing = jest.fn().mockReturnValue({
                block: {
                    id: "123",
                },
                last: 1110,
                first: 800,
                count: 1,
            });
            global.Math.random = () => 0.5;

            await monitor.broadcastBlock({
                data: {
                    height: 3,
                    id: "123",
                },
                toJson: jest.fn(),
            });

            expect(monitor.peers["1.1.1.1"].postBlock).toHaveBeenCalled();
        });
    });

    describe("broadcastTransactions", () => {
        it("should broadcast the transactions to peers", async () => {
            monitor.peers = {
                "1.1.1.1": {
                    postTransactions: jest.fn(),
                },
            };
            jest.spyOn(localConfig, "get").mockReturnValueOnce(4);

            await monitor.broadcastTransactions([
                {
                    toJson: jest.fn(),
                },
            ]);

            expect(monitor.peers["1.1.1.1"].postTransactions).toHaveBeenCalled();
        });
    });

    describe("checkNetworkHealth", () => {
        it("should return {forked: false} if majority of peers is not forked", async () => {
            monitor.peers = {
                "1.1.1.1": {
                    verification: {
                        forked: false,
                    },
                },
            };
            jest.spyOn(monitor, "getSuspendedPeers").mockReturnValueOnce([] as any);
            jest.spyOn(monitor, "__isColdStartActive").mockReturnValueOnce(true);

            expect(await monitor.checkNetworkHealth()).toEqual({ forked: false });
        });
        test.todo("more cases need to be covered, see checkNetworkHealth implementation");
    });

    describe("cachePeers", () => {
        it("should cache the peers into file", () => {
            monitor.peers = {
                "1.1.1.1": {
                    ip: "1.1.1.1",
                    port: 4000,
                    version: "2.3.0",
                },
            };
            process.env.CORE_PATH_CACHE = ".";
            monitor.cachePeers();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                "./peers.json",
                JSON.stringify([monitor.peers["1.1.1.1"]], null, 2),
            );
        });
    });

    describe("getNetworkHeight", () => {
        it("should return correct network height", () => {
            monitor.peers = {
                "1.1.1.1": { state: { height: 1 } },
                "1.1.1.2": { state: { height: 7 } },
                "1.1.1.3": { state: { height: 10 } },
            };

            expect(monitor.getNetworkHeight()).toBe(7);
        });
    });
});
