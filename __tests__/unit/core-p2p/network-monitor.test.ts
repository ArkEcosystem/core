import "jest-extended";

import "./mocks/core-container";

import { blockchain } from "./mocks/blockchain";

import { Delegate } from "@arkecosystem/core-forger";
import { P2P } from "@arkecosystem/core-interfaces";
import { Networks, Utils } from "@arkecosystem/crypto";
import { NetworkState } from "../../../packages/core-p2p/src/network-state";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { genesisBlock } from "../../utils/config/unitnet/genesisBlock";
import { delegates } from "../../utils/fixtures/unitnet";

let monitor: P2P.INetworkMonitor;
let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;
let communicator: P2P.IPeerCommunicator;

jest.setTimeout(60000);

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

            communicator.getPeers = jest.fn().mockReturnValue([{ ip: "1.1.1.1" }]);

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
                mockPeers.push({ ip: `3.3.3.${i + 101}` });
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

    describe("downloadBlocksFromHeight", () => {
        const downloadChunkSize = 400;
        const maxParallelDownloads = 25;

        const throwInDownloadAtHeight = 50000;

        const expectedBlocksFromHeight = height => {
            const blocks = [];
            for (let i = 0; i < maxParallelDownloads * downloadChunkSize; i++) {
                blocks.push({ height: height + 1 + i });
            }
            return blocks;
        };

        const mockedGetPeerBlocks = (peer, { fromBlockHeight }) => {
            if (fromBlockHeight + 1 === throwInDownloadAtHeight) {
                throw new Error(`Cannot download blocks, deliberate error`);
            }

            return expectedBlocksFromHeight(fromBlockHeight).slice(0, downloadChunkSize);
        };

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

            expect(await monitor.downloadBlocksFromHeight(1, maxParallelDownloads)).toEqual([mockBlock]);
        });

        it("should download blocks in parallel from N peers max", async () => {
            communicator.getPeerBlocks = jest.fn().mockImplementation(mockedGetPeerBlocks);

            for (let i = 0; i < maxParallelDownloads + 5; i++) {
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

            const fromHeight = 1;

            const downloadedBlocks = await monitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            const expectedBlocks = expectedBlocksFromHeight(fromHeight);

            expect(downloadedBlocks).toEqual(expectedBlocks);
        });

        it("should download blocks in parallel from all peers if less than N peers", async () => {
            communicator.getPeerBlocks = jest.fn().mockImplementation(mockedGetPeerBlocks);

            const numPeers = maxParallelDownloads - 7;

            for (let i = 0; i < numPeers; i++) {
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

            const fromHeight = 1;

            const downloadedBlocks = await monitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            const expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(0, numPeers * downloadChunkSize);

            expect(downloadedBlocks).toEqual(expectedBlocks);
        });

        it("should handle when getPeerBlocks throws", async () => {
            const mockFn = jest.fn().mockImplementation(mockedGetPeerBlocks);
            communicator.getPeerBlocks = mockFn;

            const numPeers = 5;

            for (let i = 0; i < numPeers; i++) {
                storage.setPeer(
                    createStubPeer({
                        ip: `1.1.1.${i}`,
                        port: 4000,
                        state: {
                            height: throwInDownloadAtHeight + numPeers * downloadChunkSize,
                            currentSlot: 2,
                            forgingAllowed: true,
                        },
                        verificationResult: { forked: false },
                    }),
                );
            }

            const chunksToDownloadBeforeThrow = 2;
            let fromHeight = throwInDownloadAtHeight - 1 - chunksToDownloadBeforeThrow * downloadChunkSize;

            let downloadedBlocks = await monitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            let expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(
                0,
                chunksToDownloadBeforeThrow * downloadChunkSize,
            );

            expect(downloadedBlocks).toEqual(expectedBlocks);

            expect(mockFn.mock.calls.length).toEqual(numPeers);
            for (let i = 0; i < numPeers; i++) {
                expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(fromHeight + i * downloadChunkSize);
            }

            // See that the downloaded higher 2 chunks would be returned from the cache.

            mockFn.mock.calls = [];

            fromHeight = throwInDownloadAtHeight - 1 + downloadChunkSize;

            downloadedBlocks = await monitor.downloadBlocksFromHeight(fromHeight, maxParallelDownloads);
            expectedBlocks = expectedBlocksFromHeight(fromHeight).slice(0, numPeers * downloadChunkSize);

            expect(downloadedBlocks).toEqual(expectedBlocks);

            const numFailedChunks = 1;
            const numCachedChunks = numPeers - chunksToDownloadBeforeThrow - numFailedChunks;

            expect(mockFn.mock.calls.length).toEqual(numPeers - numCachedChunks);
            for (let i = 0; i < numPeers - numCachedChunks; i++) {
                expect(mockFn.mock.calls[i][1].fromBlockHeight).toEqual(
                    fromHeight + (i + numCachedChunks) * downloadChunkSize,
                );
            }
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

            expect(await monitor.downloadBlocksFromHeight(20, maxParallelDownloads)).toEqual([mockBlock]);
        });
    });

    describe("broadcastBlock", () => {
        it("should broadcast the block to peers", async () => {
            storage.setPeer(stubPeer);

            global.Math.random = () => 0.5;

            const delegate = new Delegate(delegates[0].passphrase, Networks.unitnet.network);
            const transactions = TransactionFactory.transfer()
                .withPassphrase(delegates[0].passphrase)
                .create(10);

            const block = delegate.forge(transactions, {
                timestamp: 12345689,
                previousBlock: {
                    id: genesisBlock.id,
                    height: 1,
                },
                reward: Utils.BigNumber.ZERO,
            });

            communicator.postBlock = jest.fn();

            blockchain.getBlockPing = jest.fn().mockReturnValue({
                block: {
                    id: block.data.id,
                },
                last: 1110,
                first: 800,
                count: 1,
            });

            await monitor.broadcastBlock(block);

            expect(communicator.postBlock).toHaveBeenCalled();
        });
    });

    describe("broadcastTransactions", () => {
        it("should broadcast the transactions to peers", async () => {
            storage.setPeer(stubPeer);

            communicator.postTransactions = jest.fn();

            await monitor.broadcastTransactions(TransactionFactory.transfer().build());

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
