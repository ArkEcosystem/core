/* tslint:disable:max-line-length */
import "./mocks/";
import { container } from "./mocks/container";

import * as Utils from "@arkecosystem/core-utils";
import { Blocks, Crypto, Interfaces, Managers } from "@arkecosystem/crypto";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { stateMachine } from "../../../packages/core-blockchain/src/state-machine";
import "../../utils";
import { genesisBlock as GB } from "../../utils/config/testnet/genesisBlock";
import { blocks101to155 } from "../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { config } from "./mocks/config";
import { database } from "./mocks/database";
import { logger } from "./mocks/logger";
import { getMonitor } from "./mocks/p2p/network-monitor";
import { getStorage } from "./mocks/p2p/peer-storage";

const { BlockFactory } = Blocks;

let genesisBlock;

const blockchain = new Blockchain({});

describe("Blockchain", () => {
    beforeAll(async () => {
        // Create the genesis block after the setup has finished or else it uses a potentially
        // wrong network config.
        Managers.configManager.getMilestone().aip11 = false;
        genesisBlock = BlockFactory.fromData(GB);
        Managers.configManager.getMilestone().aip11 = true;
        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        config["exceptions.transactions"] = genesisBlock.transactions.map(tx => tx.id);
    });

    describe("dispatch", () => {
        it("should be ok", () => {
            jest.spyOn(stateMachine, "transition").mockReturnValueOnce({ actions: [] });
            const nextState = blockchain.dispatch("START");

            expect(blockchain.state.blockchain).toEqual(nextState);
        });

        it("should log an error if no action is found", () => {
            const loggerError = jest.spyOn(logger, "error");

            // @ts-ignore
            jest.spyOn(stateMachine, "transition").mockReturnValueOnce({
                actions: ["yooo"],
            });

            blockchain.dispatch("STOP");
            expect(loggerError).toHaveBeenCalledWith("No action 'yooo' found");
        });
    });

    describe("start", () => {
        it("should be ok", async () => {
            jest.spyOn(stateMachine, "transition").mockReturnValueOnce({ actions: [] });

            process.env.CORE_SKIP_BLOCKCHAIN = "false";

            const started = await blockchain.start(true);

            expect(started).toBeTrue();
        });
    });

    describe("updateNetworkStatus", () => {
        it("should call p2p updateNetworkStatus", async () => {
            const p2pUpdateNetworkStatus = jest.spyOn(getMonitor, "updateNetworkStatus");

            await blockchain.updateNetworkStatus();

            expect(p2pUpdateNetworkStatus).toHaveBeenCalled();
        });
    });

    describe("enqueueBlocks", () => {
        it("should just return if blocks provided are an empty array", async () => {
            const processQueuePush = jest.spyOn(blockchain.queue, "push");

            blockchain.enqueueBlocks([]);
            expect(processQueuePush).not.toHaveBeenCalled();
        });

        it("should enqueue the blocks provided", async () => {
            blockchain.state.lastDownloadedBlock = blocks101to155[54];

            const processQueuePush = jest.spyOn(blockchain.queue, "push");
            const blocksToEnqueue = [blocks101to155[54]];
            blockchain.enqueueBlocks(blocksToEnqueue);
            expect(processQueuePush).toHaveBeenCalledWith({ blocks: blocksToEnqueue });
        });
    });

    describe("processBlocks", () => {
        const block3 = BlockFactory.fromData(blocks2to100[1]);
        let getLastBlock;
        let setLastBlock;
        beforeEach(() => {
            getLastBlock = jest.fn(() => block3);
            setLastBlock = jest.fn(() => undefined);
            jest.spyOn(blockchain, "state", "get").mockReturnValue({
                getLastBlock,
                setLastBlock,
            } as any);
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should process a new chained block", async () => {
            const mockCallback = jest.fn(() => true);
            blockchain.state.blockchain = {};

            await blockchain.processBlocks([blocks2to100[2]], mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should process a valid block already known", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock().data;

            await blockchain.processBlocks([lastBlock], mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock().data).toEqual(lastBlock);
        });

        it("should process a new block with database saveBlocks failing once", async () => {
            const mockCallback = jest.fn(() => true);
            blockchain.state.blockchain = {};
            database.saveBlocks = jest.fn().mockRejectedValueOnce(new Error("oops"));
            jest.spyOn(blockchain, "removeTopBlocks").mockReturnValueOnce(undefined);

            await blockchain.processBlocks([blocks2to100[2]], mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should process a new block with database saveBlocks + getLastBlock failing once", async () => {
            const mockCallback = jest.fn(() => true);
            blockchain.state.blockchain = {};
            jest.spyOn(database, "saveBlocks").mockRejectedValueOnce(new Error("oops saveBlocks"));
            jest.spyOn(blockchain, "removeTopBlocks").mockReturnValueOnce(undefined);

            await blockchain.processBlocks([blocks2to100[2]], mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should broadcast a block if (Crypto.Slots.getSlotNumber() * blocktime <= block.data.timestamp)", async () => {
            blockchain.state.started = true;
            jest.spyOn(Utils, "isBlockChained").mockReturnValueOnce(true);

            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock().data;
            const spyGetSlotNumber = jest
                .spyOn(Crypto.Slots, "getSlotNumber")
                .mockReturnValue(Math.floor(lastBlock.timestamp / 8000));

            const broadcastBlock = jest.spyOn(getMonitor, "broadcastBlock");

            await blockchain.processBlocks([lastBlock], mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(broadcastBlock).toHaveBeenCalled();

            spyGetSlotNumber.mockRestore();
        });
    });

    describe("getLastBlock", () => {
        it("should be ok", () => {
            jest.spyOn(container.app, "has").mockReturnValueOnce(true);
            jest.spyOn(container.app, "resolveOptions").mockReturnValueOnce({
                state: { maxLastBlocks: 50 },
            });

            const block = Blocks.BlockFactory.fromData(blocks2to100[0]);
            blockchain.state.setLastBlock(block);

            expect(blockchain.getLastBlock()).toEqual(block);
        });
    });

    describe("handleIncomingBlock", () => {
        it("should be ok", () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getTime(),
            };

            // @ts-ignore
            blockchain.handleIncomingBlock(block);

            expect(blockchain.dispatch).toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should not handle block from future slot", () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getNextSlot()),
            };

            // @ts-ignore
            blockchain.handleIncomingBlock(block);

            expect(blockchain.dispatch).not.toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).not.toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should handle block from forger if in right slot", () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber()),
            };

            // @ts-ignore
            blockchain.handleIncomingBlock(block, false);

            expect(blockchain.dispatch).toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should not handle block from forger if in wrong slot", () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber() - 1),
            };

            // @ts-ignore
            blockchain.handleIncomingBlock(block, true);

            expect(blockchain.dispatch).not.toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).not.toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should handle block if not from forger if in wrong slot", () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber() - 1),
            };

            // @ts-ignore
            blockchain.handleIncomingBlock(block, false);

            expect(blockchain.dispatch).toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should not handle block from forger if less than 2 seconds left in slot", async () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber()),
            };

            await delay(Crypto.Slots.getTimeInMsUntilNextSlot() - 1000);

            // @ts-ignore
            blockchain.handleIncomingBlock(block, true);

            expect(blockchain.dispatch).not.toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).not.toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        }, 10000);

        it("should handle block if not from forger if less than 2 seconds left in slot", async () => {
            blockchain.state.started = true;
            const dispatch = blockchain.dispatch;
            const enqueueBlocks = blockchain.enqueueBlocks;
            blockchain.dispatch = jest.fn(() => true);
            blockchain.enqueueBlocks = jest.fn(() => true);

            const block = {
                height: 100,
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber()),
            };

            await delay(Crypto.Slots.getTimeInMsUntilNextSlot() - 1000);

            // @ts-ignore
            blockchain.handleIncomingBlock(block, false);

            expect(blockchain.dispatch).toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        }, 10000);

        it("should disregard block when blockchain is not ready", async () => {
            blockchain.state.started = false;
            const loggerInfo = jest.spyOn(logger, "info");

            const mockGetSlotNumber = jest
                .spyOn(Crypto.Slots, "getSlotNumber")
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1);

            blockchain.handleIncomingBlock(blocks101to155[54]);

            expect(loggerInfo).toHaveBeenCalledWith("Block disregarded because blockchain is not ready");
            blockchain.state.started = true;

            mockGetSlotNumber.mockRestore();
        });
    });

    describe("forceWakeup", () => {
        it("should dispatch WAKEUP", () => {
            expect(() => blockchain.forceWakeup()).toDispatch(blockchain, "WAKEUP");
        });
    });

    describe("forkBlock", () => {
        it("should dispatch FORK and set state.forkedBlock", () => {
            const forkedBlock = BlockFactory.fromData(blocks2to100[11]);
            expect(() => blockchain.forkBlock(forkedBlock)).toDispatch(blockchain, "FORK");
            expect(blockchain.state.forkedBlock).toBe(forkedBlock);

            blockchain.state.forkedBlock = undefined; // reset
        });
    });

    describe("isSynced", () => {
        describe("with a block param", () => {
            it("should be ok", () => {
                expect(
                    blockchain.isSynced({
                        timestamp: Crypto.Slots.getTime(),
                        height: genesisBlock.height,
                    } as Interfaces.IBlockData),
                ).toBeTrue();
            });
        });

        describe("without a block param", () => {
            it("should use the last block", () => {
                jest.spyOn(getStorage, "hasPeers").mockReturnValueOnce(true);
                const getLastBlock = jest.spyOn(blockchain, "getLastBlock").mockReturnValueOnce({
                    // @ts-ignore
                    data: {
                        timestamp: Crypto.Slots.getTime(),
                        height: genesisBlock.height,
                    },
                });
                expect(blockchain.isSynced()).toBeTrue();
                expect(getLastBlock).toHaveBeenCalled();
            });
        });
    });

    describe("getBlockPing", () => {
        it("should return state.blockPing", () => {
            const blockPing = {
                count: 1,
                first: new Date().getTime(),
                last: new Date().getTime(),
                block: {},
            };
            blockchain.state.blockPing = blockPing;

            expect(blockchain.getBlockPing()).toBe(blockPing);
        });
    });

    describe("pingBlock", () => {
        it("should call state.pingBlock", () => {
            blockchain.state.blockPing = undefined;

            // returns false if no state.blockPing
            expect(blockchain.pingBlock(blocks2to100[3])).toBeFalse();
        });
    });

    describe("pushPingBlock", () => {
        it("should call state.pushPingBlock", () => {
            blockchain.state.blockPing = undefined;

            blockchain.pushPingBlock(blocks2to100[3]);
            expect(blockchain.state.blockPing).toBeObject();
            expect(blockchain.state.blockPing.block).toBe(blocks2to100[3]);
        });
    });

    describe("constructor - networkStart", () => {
        it("should output log messages if launched in networkStart mode", async () => {
            const loggerWarn = jest.spyOn(logger, "warn");
            const loggerInfo = jest.spyOn(logger, "info");

            // tslint:disable-next-line: no-unused-expression
            new Blockchain({ networkStart: true });

            expect(loggerWarn).toHaveBeenCalledWith(
                "ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
            expect(loggerInfo).toHaveBeenCalledWith("Starting ARK Core for a new world, welcome aboard");
        });
    });

    describe("checkMissingBlocks", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should fork if random result is < 0.80", async () => {
            jest.spyOn(blockchain, "checkMissingBlocks");
            jest.spyOn(getMonitor, "checkNetworkHealth").mockResolvedValueOnce({ forked: true });
            jest.spyOn(Math, "random").mockReturnValue(0.2);

            // @ts-ignore
            blockchain.missedBlocks = Managers.configManager.getMilestone().activeDelegates;
            await blockchain.checkMissingBlocks();

            // @ts-ignore
            expect(blockchain.missedBlocks).toBe(0);
        });

        it("should fork if random result is 0.80", async () => {
            jest.spyOn(blockchain, "checkMissingBlocks");
            jest.spyOn(getMonitor, "checkNetworkHealth").mockResolvedValueOnce({ forked: true });
            jest.spyOn(Math, "random").mockReturnValue(0.8);

            // @ts-ignore
            blockchain.missedBlocks = Managers.configManager.getMilestone().activeDelegates;
            await blockchain.checkMissingBlocks();

            // @ts-ignore
            expect(blockchain.missedBlocks).toBe(0);
        });

        it("should not take action if random result is > 0.80", async () => {
            jest.spyOn(blockchain, "checkMissingBlocks");
            jest.spyOn(getMonitor, "checkNetworkHealth").mockResolvedValueOnce({ forked: true });
            jest.spyOn(Math, "random").mockReturnValue(0.9);

            // @ts-ignore
            blockchain.missedBlocks = Managers.configManager.getMilestone().activeDelegates;
            await blockchain.checkMissingBlocks();

            // @ts-ignore
            expect(blockchain.missedBlocks).toBe(Managers.configManager.getMilestone().activeDelegates + 1);
        });
    });
});
