import "jest-extended";

import { blockchain } from "./mocks/blockchain";
import "./mocks/core-container";
import { state } from "./mocks/state";

import { P2P } from "@arkecosystem/core-interfaces";
import { NetworkState } from "../../../packages/core-p2p/src/network-state";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";

let monitor: P2P.INetworkMonitor;
let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;
let connector: P2P.IPeerConnector;
let communicator: P2P.IPeerCommunicator;

beforeEach(() => {
    jest.resetAllMocks();

    ({ monitor, processor, storage, connector, communicator } = createPeerService());
});

describe("NetworkMonitor", () => {
    describe("start", () => {
        it("should start without error and set blockchain forceWakeup", async () => {
            const validateAndAcceptPeer = jest.spyOn(processor, "validateAndAcceptPeer");

            jest.spyOn(processor, "validatePeer").mockReturnValueOnce(true);

            await monitor.start({ networkStart: false });

            expect(validateAndAcceptPeer).toHaveBeenCalledWith(
                {
                    ip: stubPeer.ip,
                    port: stubPeer.port,
                    version: "2.3.0",
                },
                { lessVerbose: true, seed: true },
            );

            validateAndAcceptPeer.mockRestore();
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

    describe("discoverPeers", () => {
        it("should populate list of available peers from existing peers", async () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.2.3.4",
                    port: 4000,
                }),
            );

            // @ts-ignore
            monitor.config = { ignoreMinimumNetworkReach: true };

            communicator.getPeers = jest.fn().mockReturnValue([{ ip: "1.1.1.1" }, { ip: "2.2.2.2" }]);

            const validateAndAcceptPeer = jest.spyOn(processor, "validateAndAcceptPeer");
            const validatePeer = jest.spyOn(processor, "validatePeer").mockReturnValue(true);

            await monitor.discoverPeers();

            expect(validateAndAcceptPeer).toHaveBeenCalledTimes(2);
            expect(validateAndAcceptPeer).toHaveBeenCalledWith({ ip: "1.1.1.1" }, { lessVerbose: true });
            expect(validateAndAcceptPeer).toHaveBeenCalledWith({ ip: "2.2.2.2" }, { lessVerbose: true });

            validatePeer.mockRestore();
        });
    });

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

    describe("getNetworkState", () => {
        it("should return network state from NetworkState.analyze", async () => {
            const networkState = { nodeHeight: 333 };

            jest.spyOn(NetworkState, "analyze").mockReturnValue(networkState as any);

            expect(await monitor.getNetworkState()).toEqual(networkState);
        });
    });

    describe("refreshPeersAfterFork", () => {
        it("should reset the suspended peers and suspend the peer causing the fork", async () => {
            monitor.resetSuspendedPeers = jest.fn();
            connector.disconnect = jest.fn();

            const spySuspend = jest.spyOn(processor, "suspend");

            state.forkedBlock = { ip: "1.1.1.1" };

            await monitor.refreshPeersAfterFork();

            expect(monitor.resetSuspendedPeers).toHaveBeenCalled();
            expect(spySuspend).toHaveBeenCalledWith("1.1.1.1");
            expect(connector.disconnect).toHaveBeenCalled();
        });
    });

    describe("syncWithNetwork", () => {
        it("should download blocks from random peer", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    state: {
                        height: 1,
                        currentSlot: 2,
                        forgingAllowed: true,
                    },
                    verificationResult: { forked: false },
                }),
            );

            expect(await monitor.syncWithNetwork(1)).toEqual([{ ...mockBlock, ip: "1.1.1.1" }]);
        });
    });

    describe("broadcastBlock", () => {
        it("should broadcast the block to peers", async () => {
            storage.setPeer(stubPeer);

            blockchain.getBlockPing = jest.fn().mockReturnValue({
                block: {
                    id: "123",
                },
                last: 1110,
                first: 800,
                count: 1,
            });

            global.Math.random = () => 0.5;

            communicator.postBlock = jest.fn();

            await monitor.broadcastBlock({
                data: {
                    height: 3,
                    id: "123",
                },
                toJson: jest.fn(),
            });

            expect(communicator.postBlock).toHaveBeenCalled();
        });
    });

    describe("broadcastTransactions", () => {
        it("should broadcast the transactions to peers", async () => {
            storage.setPeer(stubPeer);

            communicator.postTransactions = jest.fn();

            await monitor.broadcastTransactions([
                {
                    toJson: jest.fn(),
                },
            ]);

            expect(communicator.postTransactions).toHaveBeenCalled();
        });
    });

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
