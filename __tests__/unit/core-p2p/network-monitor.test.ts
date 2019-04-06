import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../../../packages/core-p2p/src/config";
import { NetworkState } from "../../../packages/core-p2p/src/network-state";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";

let monitor: P2P.INetworkMonitor;
let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;

beforeEach(() => {
    jest.resetAllMocks();

    ({ monitor, processor, storage } = createPeerService());
});

describe("NetworkMonitor", () => {
    describe("start", () => {
        it("should start without error and set blockchain forceWakeup", async () => {
            const acceptNewPeer = jest.spyOn(processor, "acceptNewPeer");

            jest.spyOn(localConfig, "get").mockReturnValue([]);
            jest.spyOn(processor, "validatePeer").mockReturnValueOnce(true);

            await monitor.start({ networkStart: false });

            expect(acceptNewPeer).toHaveBeenCalledWith(
                {
                    ip: stubPeer.ip,
                    port: stubPeer.port,
                    version: "2.3.0",
                },
                { lessVerbose: true, seed: true },
            );

            acceptNewPeer.mockRestore();
        });
    });

    describe("cleanPeers", () => {
        it("should remove the unresponsive peers", async () => {
            storage.setPeer(stubPeer);

            const mockGetPeer = jest.spyOn(storage, "getPeer").mockReturnValue({
                ...stubPeer,
                ping: jest.fn().mockImplementation(() => {
                    throw new Error("yo");
                }),
            } as any);
            await monitor.cleanPeers();
            expect(storage.hasPeers()).toBeFalse();
            mockGetPeer.mockRestore();
        });
    });

    // describe("discoverPeers", () => {
    //     it("should populate list of available peers from existing peers", async () => {
    //         const peerMock = {
    //             ip: "1.2.3.4",
    //             port: 4000,
    //             getPeers: jest.fn().mockReturnValue([{ ip: "1.1.1.1" }, { ip: "2.2.2.2" }]),
    //         };
    //         monitor.peers = { [peerMock.ip]: peerMock };
    //         monitor.config = { ignoreMinimumNetworkReach: true };
    //         const acceptNewPeer = jest.spyOn(monitor, "acceptNewPeer");
    //         const validatePeer = jest.spyOn(monitor, "validatePeer").mockReturnValue(true);

    //         await monitor.discoverPeers();
    //         expect(acceptNewPeer).toHaveBeenCalledTimes(2);
    //         expect(acceptNewPeer).toHaveBeenCalledWith({ ip: "1.1.1.1" }, { lessVerbose: true });
    //         expect(acceptNewPeer).toHaveBeenCalledWith({ ip: "2.2.2.2" }, { lessVerbose: true });
    //         validatePeer.mockRestore();
    //     });
    // });

    describe("getNetworkHeight", () => {
        it("should return correct network height", () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    state: { height: 1 },
                }),
            );

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.2",
                    port: 4000,
                    state: { height: 7 },
                }),
            );

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.3",
                    port: 4000,
                    state: { height: 10 },
                }),
            );

            expect(monitor.getNetworkHeight()).toBe(7);
        });
    });

    describe("getPBFTForgingStatus", () => {
        it("should return correct pbft data", () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    state: { height: 1, currentSlot: 2, forgingAllowed: true },
                }),
            );

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.2",
                    port: 4000,
                    state: { height: 7, currentSlot: 2, forgingAllowed: true },
                }),
            );

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.3",
                    port: 4000,
                    state: { height: 10, currentSlot: 2, forgingAllowed: true },
                }),
            );

            jest.spyOn(slots, "getSlotNumber").mockReturnValue(2);

            expect(monitor.getPBFTForgingStatus()).toBe(2 / 3);
        });

        test.todo("more cases need to be covered, see pbft calculation");
    });

    describe("getNetworkState", () => {
        it("should return network state from NetworkState.analyze", async () => {
            const networkState = { nodeHeight: 333 };

            jest.spyOn(NetworkState, "analyze").mockReturnValue(networkState as any);

            expect(await monitor.getNetworkState()).toEqual(networkState);
        });
    });

    // describe("refreshPeersAfterFork", () => {
    //     it("should reset the suspended peers and suspend the peer causing the fork", async () => {
    //         monitor.peers = {};
    //         (monitor.guard as any) = {
    //             resetSuspendedPeers: jest.fn(),
    //         };
    //         const suspendPeer = jest.spyOn(monitor, "suspendPeer");
    //         state.forkedBlock = { ip: "1.1.1.1" };
    //         await monitor.refreshPeersAfterFork();
    //         expect(monitor.guard.resetSuspendedPeers).toHaveBeenCalled();
    //         expect(suspendPeer).toHaveBeenCalledWith("1.1.1.1");
    //     });
    // });

    // describe("downloadBlocks", () => {
    //     it("should download blocks from random peer", async () => {
    //         const mockBlock = { id: "123456" };
    //         monitor.peers = {
    //             "1.1.1.1": {
    //                 ip: "1.1.1.1",
    //                 state: {
    //                     height: 1,
    //                     currentSlot: 2,
    //                     forgingAllowed: true,
    //                 },
    //                 ban: 0,
    //                 verification: {
    //                     forked: false,
    //                 },
    //                 downloadBlocks: jest.fn().mockReturnValue([mockBlock]),
    //             },
    //         };
    //         expect(await monitor.downloadBlocks(1)).toEqual([{ ...mockBlock, ip: "1.1.1.1" }]);
    //     });
    // });

    // describe("broadcastBlock", () => {
    //     it("should broadcast the block to peers", async () => {
    //         monitor.peers = {
    //             "1.1.1.1": {
    //                 postBlock: jest.fn(),
    //             },
    //         };
    //         blockchain.getBlockPing = jest.fn().mockReturnValue({
    //             block: {
    //                 id: "123",
    //             },
    //             last: 1110,
    //             first: 800,
    //             count: 1,
    //         });
    //         global.Math.random = () => 0.5;
    //         await monitor.broadcastBlock({
    //             data: {
    //                 height: 3,
    //                 id: "123",
    //             },
    //             toJson: jest.fn(),
    //         });
    //         expect(monitor.peers["1.1.1.1"].postBlock).toHaveBeenCalled();
    //     });
    // });

    // describe("broadcastTransactions", () => {
    //     it("should broadcast the transactions to peers", async () => {
    //         monitor.peers = {
    //             "1.1.1.1": {
    //                 postTransactions: jest.fn(),
    //             },
    //         };
    //         jest.spyOn(localConfig, "get").mockReturnValueOnce(4);
    //         await monitor.broadcastTransactions([
    //             {
    //                 toJson: jest.fn(),
    //             },
    //         ]);
    //         expect(monitor.peers["1.1.1.1"].postTransactions).toHaveBeenCalled();
    //     });
    // });

    describe("checkNetworkHealth", () => {
        it("should return {forked: false} if majority of peers is not forked", async () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    verificationResult: {
                        forked: false,
                    },
                }),
            );

            jest.spyOn(storage, "getSuspendedPeers").mockReturnValueOnce([] as any);
            jest.spyOn(monitor, "isColdStartActive").mockReturnValueOnce(true);

            expect(await monitor.checkNetworkHealth()).toEqual({ forked: false });
        });

        test.todo("more cases need to be covered, see checkNetworkHealth implementation");
    });
});
