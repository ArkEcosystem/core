import "jest-extended";

import { Container } from "@packages/core-kernel/src";
import { StateStore } from "@packages/core-state/src/stores/state";
import { FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { IBlock, IBlockData, ITransactionData } from "@packages/crypto/dist/interfaces";
import delay from "delay";

import { makeChainedBlocks } from "../__utils__/make-chained-block";
import { setUp } from "../setup";

let blocks: IBlock[];
let stateStorage: StateStore;
let factory: FactoryBuilder;
let logger: jest.SpyInstance;
let dispatchSpy: jest.SpyInstance;

beforeEach(async () => {
    const initialEnv = await setUp();
    factory = initialEnv.factory;
    logger = initialEnv.spies.logger.info;
    dispatchSpy = initialEnv.spies.dispatchSpy;
    stateStorage = initialEnv.sandbox.app.get(Container.Identifiers.StateStore);
    blocks = makeChainedBlocks(101, factory.get("Block"));
});

afterAll(() => jest.clearAllMocks());

describe("State Storage", () => {
    describe("getBlockchain", () => {
        it("should return initial state", () => {
            expect(stateStorage.getBlockchain()).toEqual({});
        });
    });

    describe("setBlockchain", () => {
        it("should set blockchain state", () => {
            const state = {
                value: "dummy_state",
            };

            stateStorage.setBlockchain(state);
            expect(stateStorage.getBlockchain()).toEqual(state);
        });
    });

    describe("isStarted", () => {
        it("should be false by default", () => {
            expect(stateStorage.isStarted()).toEqual(false);
        });
    });

    describe("setStarted", () => {
        it("should set value", () => {
            stateStorage.setStarted(true);
            expect(stateStorage.isStarted()).toEqual(true);
        });
    });

    describe("getForkedBlock", () => {
        it("should be undefined by default", () => {
            expect(stateStorage.getForkedBlock()).toBeUndefined();
        });
    });

    describe("setForkedBlock", () => {
        it("should set forkedBlock", () => {
            const block = {
                id: "dummy_id",
            };
            // @ts-ignore
            stateStorage.setForkedBlock(block);
            expect(stateStorage.getForkedBlock()).toBe(block);
        });
    });

    describe("clearForkedBlock", () => {
        it("should clear forkedBlock", () => {
            const block = {
                id: "dummy_id",
            };
            // @ts-ignore
            stateStorage.setForkedBlock(block);
            expect(stateStorage.getForkedBlock()).toBe(block);

            stateStorage.clearForkedBlock();
            expect(stateStorage.getForkedBlock()).toBeUndefined();
        });
    });

    describe("getNoBlockCounter", () => {
        it("should return 0 by default", () => {
            expect(stateStorage.getNoBlockCounter()).toEqual(0);
        });
    });

    describe("setNoBlockCounter", () => {
        it("should set noBlockCounter", () => {
            stateStorage.setNoBlockCounter(3);
            expect(stateStorage.getNoBlockCounter()).toEqual(3);
        });
    });

    describe("getP2pUpdateCounter", () => {
        it("should return 0 by default", () => {
            expect(stateStorage.getP2pUpdateCounter()).toEqual(0);
        });
    });

    describe("setP2pUpdateCounter", () => {
        it("should set p2pUpdateCounter", () => {
            stateStorage.setP2pUpdateCounter(3);
            expect(stateStorage.getP2pUpdateCounter()).toEqual(3);
        });
    });

    describe("getNumberOfBlocksToRollback", () => {
        it("should return 0 by default", () => {
            expect(stateStorage.getNumberOfBlocksToRollback()).toEqual(0);
        });
    });

    describe("setNumberOfBlocksToRollback", () => {
        it("should set numberOfBlocksToRollback", () => {
            stateStorage.setNumberOfBlocksToRollback(3);
            expect(stateStorage.getNumberOfBlocksToRollback()).toEqual(3);
        });
    });

    describe("getNetworkStart", () => {
        it("should return false by default", () => {
            expect(stateStorage.getNetworkStart()).toBeFalse();
        });
    });

    describe("setNetworkStart", () => {
        it("should set networkStart", () => {
            stateStorage.setNetworkStart(true);
            expect(stateStorage.getNetworkStart()).toBeTrue();
        });
    });

    describe("getRestoredDatabaseIntegrity", () => {
        it("should return false by default", () => {
            expect(stateStorage.getRestoredDatabaseIntegrity()).toBeFalse();
        });
    });

    describe("setRestoredDatabaseIntegrity", () => {
        it("should set restoredDatabaseIntegrity", () => {
            stateStorage.setRestoredDatabaseIntegrity(true);
            expect(stateStorage.getRestoredDatabaseIntegrity()).toBeTrue();
        });
    });

    describe("getMaxLastBlocks", () => {
        it("should return max last blocks limit", () => {
            expect(stateStorage.getMaxLastBlocks()).toBe(100);
        });
    });

    describe("getLastHeight", () => {
        it("should return the last block height", () => {
            stateStorage.setLastBlock(blocks[0]);
            stateStorage.setLastBlock(blocks[1]);

            expect(stateStorage.getLastHeight()).toBe(blocks[1].data.height);
        });
    });

    describe("getLastBlock", () => {
        it("should throw when there is no last block", () => {
            // TODO: check that we now prefer this to throw than toBeUndefined()?
            expect(() => stateStorage.getLastBlock()).toThrow();
        });

        it("should return the last block", () => {
            stateStorage.setLastBlock(blocks[0]);
            stateStorage.setLastBlock(blocks[1]);

            expect(stateStorage.getLastBlock()).toBe(blocks[1]);
        });
    });

    describe("setLastBlock", () => {
        it("should set the last block", () => {
            stateStorage.setLastBlock(blocks[0]);
            expect(stateStorage.getLastBlock()).toBe(blocks[0]);
        });

        it("should not exceed the max last blocks", () => {
            for (let i = 0; i < 100; i++) {
                // 100 is default
                stateStorage.setLastBlock(blocks[i]);
            }

            expect(stateStorage.getLastBlocks()).toHaveLength(100);
            expect(stateStorage.getLastBlock()).toBe(blocks[99]);
            expect(stateStorage.getLastBlocks().slice(-1)[0]).toBe(blocks[0]);

            // Push one more to remove the first last block.
            stateStorage.setLastBlock(blocks[100]);

            expect(stateStorage.getLastBlocks()).toHaveLength(100);
            expect(stateStorage.getLastBlock()).toBe(blocks[100]);
            expect(stateStorage.getLastBlocks().slice(-1)[0]).toBe(blocks[1]);
        });

        it("should remove last blocks when going to lower height", () => {
            for (let i = 0; i < 100; i++) {
                // 100 is default
                stateStorage.setLastBlock(blocks[i]);
            }

            expect(stateStorage.getLastBlocks()).toHaveLength(100);
            expect(stateStorage.getLastBlock()).toBe(blocks[99]);

            // Set last height - 1
            stateStorage.setLastBlock(blocks[98]);

            expect(stateStorage.getLastBlocks()).toHaveLength(99);
            expect(stateStorage.getLastBlock()).toBe(blocks[98]);

            // Set to first block
            stateStorage.setLastBlock(blocks[0]);
            expect(stateStorage.getLastBlocks()).toHaveLength(1);
            expect(stateStorage.getLastBlock()).toBe(blocks[0]);
        });
    });

    describe("getLastBlocks", () => {
        it("should return the last blocks", () => {
            for (let i = 0; i < 5; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocks = stateStorage.getLastBlocks();
            expect(lastBlocks).toHaveLength(5);

            for (let i = 0; i < 5; i++) {
                expect(lastBlocks[i].data.height).toBe(6 - i); // Height started at 2
                expect(lastBlocks[i]).toBe(blocks[4 - i]);
            }
        });
    });

    describe("getLastBlocksData", () => {
        it("should return the last blocks data", () => {
            for (let i = 0; i < 5; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocksData = stateStorage.getLastBlocksData().toArray() as IBlockData[];
            expect(lastBlocksData).toHaveLength(5);

            for (let i = 0; i < 5; i++) {
                expect(lastBlocksData[i].height).toBe(6 - i); // Height started at 2
                expect(lastBlocksData[i]).toHaveProperty("transactions");
                delete lastBlocksData[i].transactions;
                expect(lastBlocksData[i]).toEqual(blocks[4 - i].data);
            }
        });

        it("should return last blocks data with headers only", () => {
            for (let i = 0; i < 5; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocksData = stateStorage.getLastBlocksData(true).toArray() as IBlockData[];

            expect(lastBlocksData).toHaveLength(5);
        });

        it("should return last blocks which have transactions", () => {
            for (let i = 0; i < 5; i++) {
                // @ts-ignore
                blocks[i].transactions = [
                    // @ts-ignore
                    {
                        id: "test",
                    },
                ];
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocksData = stateStorage.getLastBlocksData().toArray() as IBlockData[];

            expect(lastBlocksData).toHaveLength(5);
        });

        it("should handle milestones", () => {
            blocks[0].data.height = 1;
            stateStorage.setLastBlock(blocks[0]);
            expect(dispatchSpy).toHaveBeenCalledWith("crypto.milestone.changed");
        });
    });

    describe("getLastBlockIds", () => {
        it("should return the last blocks data", () => {
            for (let i = 0; i < 5; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlockIds = stateStorage.getLastBlockIds();
            expect(lastBlockIds).toHaveLength(5);

            for (let i = 0; i < 5; i++) {
                expect(lastBlockIds[i]).toBe(blocks[4 - i].data.id);
            }
        });
    });

    describe("getGenesisBlock", () => {
        it("should set and get the genesis block", () => {
            const genesisBlock = blocks[0];
            expect(() => stateStorage.setGenesisBlock(genesisBlock)).not.toThrow();
            expect(stateStorage.getGenesisBlock()).toEqual(genesisBlock);
        });
    });

    describe("getLastBlocksByHeight", () => {
        it("should return the last blocks data", () => {
            for (let i = 0; i < 100; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocksByHeight = stateStorage.getLastBlocksByHeight(0, 101);
            expect(lastBlocksByHeight).toHaveLength(100);
            expect(lastBlocksByHeight[0].height).toBe(blocks[0].data.height);
        });

        it("should return one last block if no end height", () => {
            for (let i = 0; i < 100; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            const lastBlocksByHeight = stateStorage.getLastBlocksByHeight(50);
            expect(lastBlocksByHeight).toHaveLength(1);
            expect(lastBlocksByHeight[0].height).toBe(50);
        });

        it("should return full blocks and block headers", () => {
            // TODO: should use the factory and inject transactions
            stateStorage.setLastBlock(blocks[0]);

            let lastBlocksByHeight = stateStorage.getLastBlocksByHeight(2, 2, true);
            expect(lastBlocksByHeight).toHaveLength(1);
            expect(lastBlocksByHeight[0].height).toBe(2);
            expect(lastBlocksByHeight[0].transactions).toBeUndefined();

            lastBlocksByHeight = stateStorage.getLastBlocksByHeight(2, 2);
            expect(lastBlocksByHeight).toHaveLength(1);
            expect(lastBlocksByHeight[0].height).toBe(2);
            expect(lastBlocksByHeight[0].transactions).toHaveLength(0);
        });
    });

    describe("get/setLastDownloadedBlock", () => {
        it("should return undefined if last downloaded block is not set", () => {
            expect(stateStorage.getLastDownloadedBlock()).toBeUndefined();
        });

        it("should set and get last downloaded block", () => {
            const blockData = blocks[0].data;
            stateStorage.setLastDownloadedBlock(blockData);
            expect(stateStorage.getLastDownloadedBlock()).toBe(blockData);
        });
    });

    describe("get/setLastStoredBlockHeight", () => {
        it("should return undefined if last stored block is not set", () => {
            expect(stateStorage.getLastStoredBlockHeight()).toBe(1);
        });

        it("should set and get last downloaded block", () => {
            stateStorage.setLastStoredBlockHeight(10);
            expect(stateStorage.getLastStoredBlockHeight()).toBe(10);
        });
    });

    describe("getCommonBlocks", () => {
        it("should get common blocks", () => {
            for (let i = 0; i < 100; i++) {
                stateStorage.setLastBlock(blocks[i]);
            }

            // Heights 90 - 100
            const ids = blocks.slice(89, 99).map((block) => block.data.id);
            const commonBlocks = stateStorage.getCommonBlocks(ids);
            expect(ids).toHaveLength(10);
            expect(commonBlocks).toHaveLength(10);

            for (let i = 0; i < commonBlocks.length; i++) {
                expect(commonBlocks[i].height).toBe(blocks[98 - i].data.height);
            }
        });
    });

    describe("cacheTransactions", () => {
        it("should add transaction id", () => {
            expect(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData])).toEqual({
                added: [{ id: "1" }],
                notAdded: [],
            });
            expect(stateStorage.getCachedTransactionIds()).toHaveLength(1);
        });

        it("should not add duplicate transaction ids", () => {
            expect(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData])).toEqual({
                added: [{ id: "1" }],
                notAdded: [],
            });
            expect(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData])).toEqual({
                added: [],
                notAdded: [{ id: "1" }],
            });
            expect(stateStorage.getCachedTransactionIds()).toHaveLength(1);
        });

        it("should not add more than 10000 unique transaction ids", () => {
            const transactions = [];
            for (let i = 0; i < 10000; i++) {
                transactions.push({ id: i.toString() });
            }

            expect(stateStorage.cacheTransactions(transactions)).toEqual({
                added: transactions,
                notAdded: [],
            });

            expect(stateStorage.getCachedTransactionIds()).toHaveLength(10000);
            expect(stateStorage.getCachedTransactionIds()[0]).toEqual("0");

            expect(stateStorage.cacheTransactions([{ id: "10000" } as any])).toEqual({
                added: [{ id: "10000" }],
                notAdded: [],
            });
            expect(stateStorage.getCachedTransactionIds()).toHaveLength(10000);
            expect(stateStorage.getCachedTransactionIds()[0]).toEqual("1");
        });
    });

    describe("clearCachedTransactionIds", () => {
        it("should remove cached transaction ids", () => {
            const transactions = [];
            for (let i = 0; i < 10; i++) {
                transactions.push({ id: i.toString() });
            }

            expect(stateStorage.cacheTransactions(transactions)).toEqual({
                added: transactions,
                notAdded: [],
            });

            expect(stateStorage.getCachedTransactionIds()).toHaveLength(10);
            stateStorage.clearCachedTransactionIds();
            expect(stateStorage.getCachedTransactionIds()).toHaveLength(0);
        });
    });

    describe("reset", () => {
        it("should reset initial blockchain state", () => {
            const mockBlockChainMachine = {
                initialState: "mock",
            };
            stateStorage.reset(mockBlockChainMachine);

            expect(stateStorage.getBlockchain()).toEqual(mockBlockChainMachine.initialState);
        });
    });

    describe("pingBlock", () => {
        it("should return false if there is no blockPing", () => {
            // @ts-ignore
            stateStorage.blockPing = undefined;
            expect(stateStorage.pingBlock(blocks[5].data)).toBeFalse();
        });

        it("should return true if block pinged == current blockPing and should update stats", async () => {
            const currentTime = new Date().getTime();
            // @ts-ignore
            stateStorage.blockPing = {
                count: 1,
                first: currentTime,
                last: currentTime,
                block: blocks[5].data,
            };
            await delay(20);

            expect(stateStorage.pingBlock(blocks[5].data)).toBeTrue();

            const blockPing = stateStorage.getBlockPing()!;
            expect(blockPing.count).toBe(2);
            expect(blockPing.block).toBe(blocks[5].data);
            expect(blockPing.last).toBeGreaterThan(currentTime);
            expect(blockPing.first).toBe(currentTime);
        });

        it("should return false if block pinged != current blockPing", () => {
            const currentTime = new Date().getTime();
            // @ts-ignore
            stateStorage.blockPing = {
                count: 1,
                first: currentTime,
                last: currentTime,
                block: blocks[3].data,
            };
            expect(stateStorage.pingBlock(blocks[5].data)).toBeFalse();

            const blockPing = stateStorage.getBlockPing()!;
            expect(blockPing.count).toBe(1);
            expect(blockPing.block).toBe(blocks[3].data);
            expect(blockPing.last).toBe(currentTime);
            expect(blockPing.first).toBe(currentTime);
        });
    });

    describe("pushPingBlock", () => {
        it("should push the block provided as blockPing", () => {
            // @ts-ignore
            stateStorage.blockPing = undefined;

            stateStorage.pushPingBlock(blocks[5].data);

            const blockPing = stateStorage.getBlockPing()!;
            expect(blockPing).toBeObject();
            expect(blockPing.block).toBe(blocks[5].data);
            expect(blockPing.count).toBe(1);
        });

        it("should log info message if there is already a blockPing", async () => {
            // @ts-ignore
            stateStorage.blockPing = {
                count: 1,
                first: new Date().getTime(),
                last: new Date().getTime(),
                block: blocks[3].data,
            };

            stateStorage.pushPingBlock(blocks[5].data);
            expect(logger).toHaveBeenCalledWith(
                `Previous block ${blocks[3].data.height.toLocaleString()} pinged blockchain 1 times`,
            );

            const blockPing = stateStorage.getBlockPing()!;
            expect(blockPing).toBeObject();
            expect(blockPing.block).toBe(blocks[5].data);
            expect(blockPing.count).toBe(1);
        });

        it("should log info message if there is already a blockPing when pushed fromForger", async () => {
            // @ts-ignore
            stateStorage.blockPing = {
                count: 0,
                first: new Date().getTime(),
                last: new Date().getTime(),
                block: blocks[3].data,
            };

            stateStorage.pushPingBlock(blocks[5].data, true);
            expect(logger).toHaveBeenCalledWith(
                `Previous block ${blocks[3].data.height.toLocaleString()} pinged blockchain 0 times`,
            );

            const blockPing = stateStorage.getBlockPing()!;
            expect(blockPing).toBeObject();
            expect(blockPing.block).toBe(blocks[5].data);
            expect(blockPing.count).toBe(0);
        });
    });

    describe("isWakeUpTimeoutSet", () => {
        it("should return false if timer is not set", async () => {
            expect(stateStorage.isWakeUpTimeoutSet()).toBeFalse();
        });

        it("should return true if timer is set", async () => {
            stateStorage.setWakeUpTimeout(jest.fn(), 100);

            expect(stateStorage.isWakeUpTimeoutSet()).toBeTrue();

            await delay(200);

            expect(stateStorage.isWakeUpTimeoutSet()).toBeFalse();
        });
    });

    describe("setWakeUpTimeout", () => {
        it("should call callback and clear timeout", async () => {
            const callbackFn = jest.fn();
            const spyOnClearWakeUpTimeout = jest.spyOn(stateStorage, "clearWakeUpTimeout");

            stateStorage.setWakeUpTimeout(callbackFn, 100);

            await delay(200);

            expect(callbackFn).toHaveBeenCalled();
            expect(spyOnClearWakeUpTimeout).toHaveBeenCalled();
        });
    });

    describe("clearWakeUpTimeout", () => {
        it("should clear wake up timers", () => {
            jest.useFakeTimers();
            // @ts-ignore
            stateStorage.wakeUpTimeout = 1;

            stateStorage.clearWakeUpTimeout();

            expect(clearTimeout).toHaveBeenCalledWith(1);
        });

        it("should do nothing if a timer is not set", () => {
            jest.useFakeTimers();

            stateStorage.clearWakeUpTimeout();

            expect(clearTimeout).not.toHaveBeenCalled();
        });
    });
});
