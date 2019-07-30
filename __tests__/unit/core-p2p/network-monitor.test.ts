import "jest-extended";

import "./mocks/core-container";

import { blockchain } from "./mocks/blockchain";

import { P2P } from "@arkecosystem/core-interfaces";
import { Blocks, Transactions } from "@arkecosystem/crypto";
import { NetworkState } from "../../../packages/core-p2p/src/network-state";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";
import { genesisBlock } from "../../utils/config/unitnet/genesisBlock";

let monitor: P2P.INetworkMonitor;
let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;
let communicator: P2P.IPeerCommunicator;

beforeEach(() => {
    jest.resetAllMocks();

    ({ monitor, processor, storage, communicator } = createPeerService());
});

describe("NetworkMonitor", () => {
    describe("start", () => {
        it("should start without error and set blockchain forceWakeup", async () => {
            const validateAndAcceptPeer = jest.spyOn(processor, "validateAndAcceptPeer");

            jest.spyOn(processor, "validatePeerIp").mockReturnValueOnce(true);

            await monitor.start();

            expect(validateAndAcceptPeer).toHaveBeenCalledWith(
                {
                    ip: stubPeer.ip,
                    port: stubPeer.port,
                    version: "2.4.0",
                },
                { lessVerbose: true, seed: true },
            );

            validateAndAcceptPeer.mockRestore();
        });
    });

    describe("cleansePeers", () => {
        it("should remove the unresponsive peers", async () => {
            storage.setPeer(stubPeer);

            const mockGetPeer = jest.spyOn(storage, "getPeer").mockReturnValue({
                ...stubPeer,
                ping: jest.fn().mockImplementation(() => {
                    throw new Error("yo");
                }),
            } as any);
            await monitor.cleansePeers();
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
            const validatePeerIp = jest.spyOn(processor, "validatePeerIp").mockReturnValue(true);

            await expect(monitor.discoverPeers(true)).resolves.toBeTrue();

            expect(validateAndAcceptPeer).toHaveBeenCalledTimes(2);
            expect(validateAndAcceptPeer).toHaveBeenCalledWith({ ip: "1.1.1.1" }, { lessVerbose: true });
            expect(validateAndAcceptPeer).toHaveBeenCalledWith({ ip: "2.2.2.2" }, { lessVerbose: true });

            validateAndAcceptPeer.mockReset();

            await expect(monitor.discoverPeers()).resolves.toBeFalse();

            expect(validateAndAcceptPeer).not.toHaveBeenCalled();

            validatePeerIp.mockRestore();
        });

        it("should discover new peers when below minimum", async () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.2.3.4",
                    port: 4000,
                }),
            );
            storage.setPeer(
                createStubPeer({
                    ip: "1.2.3.5",
                    port: 4000,
                }),
            );

            // @ts-ignore
            monitor.config = { ignoreMinimumNetworkReach: true };

            const validateAndAcceptPeer = jest.spyOn(processor, "validateAndAcceptPeer");
            const validatePeerIp = jest.spyOn(processor, "validatePeerIp").mockReturnValue(true);

            communicator.getPeers = jest.fn().mockReturnValue([{ ip: "1.1.1.1" }, { ip: "2.2.2.2" }]);

            await expect(monitor.discoverPeers()).resolves.toBeFalse();

            expect(validateAndAcceptPeer).not.toHaveBeenCalled();

            const fakePeers = [];
            for (let i = 0; i < 10; i++) {
                fakePeers.push({ ip: `${i + 1}.${i + 1}.${i + 1}.${i + 1}` });
            }

            communicator.getPeers = jest.fn().mockReturnValue(fakePeers);

            await expect(monitor.discoverPeers()).resolves.toBeTrue();

            expect(validateAndAcceptPeer).toHaveBeenCalledTimes(10);

            for (let i = 0; i < 10; i++) {
                expect(validateAndAcceptPeer).toHaveBeenCalledWith(fakePeers[i], { lessVerbose: true });
            }

            validatePeerIp.mockRestore();
        });

        it("should only pick up to 50 returned peers from a peer", async () => {
            storage.setPeer(
                createStubPeer({
                    ip: "1.2.3.4",
                    port: 4000,
                }),
            );

            // @ts-ignore
            monitor.config = { ignoreMinimumNetworkReach: true };

            const mockPeers = [];
            for (let i = 0; i < 100; i++) {
                mockPeers.push({ ip: `3.3.3.${i + 1}` });
                mockPeers.push({ ip: `3.3.${i + 1}.3` });
                mockPeers.push({ ip: `3.${i + 1}.3.3` });
                mockPeers.push({ ip: `${i + 1}.3.3.3` });
            }

            communicator.getPeers = jest.fn().mockReturnValue(mockPeers);

            const validateAndAcceptPeer = jest.spyOn(processor, "validateAndAcceptPeer");
            const validatePeerIp = jest.spyOn(processor, "validatePeerIp").mockReturnValue(true);

            await expect(monitor.discoverPeers(true)).resolves.toBeTrue();

            expect(validateAndAcceptPeer).toHaveBeenCalledTimes(50);

            validateAndAcceptPeer.mockReset();
            validatePeerIp.mockRestore();
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
            const spyCleansePeers = jest.spyOn(monitor, "cleansePeers");
            await monitor.refreshPeersAfterFork();
            expect(spyCleansePeers).toHaveBeenCalled();
            spyCleansePeers.mockRestore();
        });
    });

    describe("syncWithNetwork", () => {
        it("should download blocks from 1 peer", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    state: {
                        height: 2,
                        currentSlot: 2,
                        forgingAllowed: true,
                    },
                    verificationResult: { forked: false },
                }),
            );

            expect(await monitor.syncWithNetwork(1)).toEqual([mockBlock]);
        });

        it("should download blocks in parallel from 25 peers max", async () => {
            communicator.getPeerBlocks = jest
                .fn()
                .mockImplementation((peer, { fromBlockHeight }) => [{ id: `11${fromBlockHeight}` }]);

            for (let i = 0; i < 30; i++) {
                storage.setPeer(
                    createStubPeer({
                        ip: `1.1.1.${i}`,
                        port: 4000,
                        state: {
                            height: 12500,
                            currentSlot: 2,
                            forgingAllowed: true,
                        },
                        verificationResult: { forked: false },
                    }),
                );
            }

            const expectedBlocks = [];
            for (let i = 0; i < 25; i++) {
                expectedBlocks.push({ id: `11${1 + i * 400}` });
            }
            expect(await monitor.syncWithNetwork(1)).toEqual(expectedBlocks);
        });

        it("should download blocks in parallel from all peers if less than 25 peers", async () => {
            communicator.getPeerBlocks = jest
                .fn()
                .mockImplementation((peer, { fromBlockHeight }) => [{ id: `11${fromBlockHeight}` }]);

            for (let i = 0; i < 18; i++) {
                storage.setPeer(
                    createStubPeer({
                        ip: `1.1.1.${i}`,
                        port: 4000,
                        state: {
                            height: 12500,
                            currentSlot: 2,
                            forgingAllowed: true,
                        },
                        verificationResult: { forked: false },
                    }),
                );
            }

            const expectedBlocks = [];
            for (let i = 0; i < 18; i++) {
                expectedBlocks.push({ id: `11${1 + i * 400}` });
            }
            expect(await monitor.syncWithNetwork(1)).toEqual(expectedBlocks);
        });

        it("should download blocks in parallel until median network height and no more", async () => {
            communicator.getPeerBlocks = jest
                .fn()
                .mockImplementation((peer, { fromBlockHeight }) => [{ id: `11${fromBlockHeight}` }]);

            for (let i = 0; i < 30; i++) {
                storage.setPeer(
                    createStubPeer({
                        ip: `1.1.1.${i}`,
                        port: 4000,
                        state: {
                            height: 1250,
                            currentSlot: 2,
                            forgingAllowed: true,
                        },
                        verificationResult: { forked: false },
                    }),
                );
            }

            const expectedBlocks = [];
            for (let i = 0; i < 4; i++) {
                expectedBlocks.push({ id: `11${1 + i * 400}` });
            }
            expect(await monitor.syncWithNetwork(1)).toEqual(expectedBlocks);
        });

        it("should handle when getPeerBlocks throws (can be peer timeout or wrong response)", async () => {
            communicator.getPeerBlocks = jest
                .fn()
                .mockRejectedValueOnce("peer mock error")
                .mockImplementation((peer, { fromBlockHeight }) => [{ id: `11${fromBlockHeight}` }]);

            for (let i = 0; i < 5; i++) {
                storage.setPeer(
                    createStubPeer({
                        ip: `1.1.1.${i}`,
                        port: 4000,
                        state: {
                            height: 12500,
                            currentSlot: 2,
                            forgingAllowed: true,
                        },
                        verificationResult: { forked: false },
                    }),
                );
            }

            const expectedBlocks = [];
            for (let i = 0; i < 5; i++) {
                expectedBlocks.push({ id: `11${1 + i * 400}` });
            }
            expect(await monitor.syncWithNetwork(1)).toEqual(expectedBlocks);
        });

        it("should still download blocks from 1 peer if network height === our height", async () => {
            const mockBlock = { id: "123456" };

            communicator.getPeerBlocks = jest.fn().mockReturnValue([mockBlock]);

            storage.setPeer(
                createStubPeer({
                    ip: "1.1.1.1",
                    port: 4000,
                    state: {
                        height: 20,
                        currentSlot: 2,
                        forgingAllowed: true,
                    },
                    verificationResult: { forked: false },
                }),
            );

            expect(await monitor.syncWithNetwork(20)).toEqual([mockBlock]);
        });
    });

    describe("broadcastBlock", () => {
        it("should broadcast the block to peers", async () => {
            storage.setPeer(stubPeer);

            blockchain.getBlockPing = jest.fn().mockReturnValue({
                block: {
                    id: genesisBlock.id,
                },
                last: 1110,
                first: 800,
                count: 1,
            });

            global.Math.random = () => 0.5;

            communicator.postBlock = jest.fn();

            await monitor.broadcastBlock(Blocks.BlockFactory.fromData(genesisBlock));

            expect(communicator.postBlock).toHaveBeenCalled();
        });
    });

    describe("broadcastTransactions", () => {
        it("should broadcast the transactions to peers", async () => {
            storage.setPeer(stubPeer);

            communicator.postTransactions = jest.fn();

            await monitor.broadcastTransactions([
                Transactions.TransactionFactory.fromData(genesisBlock.transactions[0]),
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

            expect(await monitor.checkNetworkHealth()).toEqual({ forked: false });
        });

        test.todo("more cases need to be covered, see checkNetworkHealth implementation");
    });
});
