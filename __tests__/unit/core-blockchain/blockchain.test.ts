/* tslint:disable:max-line-length */
import "./mocks/";

import { blocks, interfaces, slots } from "@arkecosystem/crypto";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { config as localConfig } from "../../../packages/core-blockchain/src/config";
import { stateMachine } from "../../../packages/core-blockchain/src/state-machine";
import "../../utils";
import { blocks101to155 } from "../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { config } from "./mocks/config";
import { logger } from "./mocks/logger";
import { getMonitor } from "./mocks/p2p/network-monitor";
import { getStorage } from "./mocks/p2p/peer-storage";

const { Block } = blocks;

let genesisBlock;

const blockchain = new Blockchain({});

describe("Blockchain", () => {
    beforeAll(async () => {
        // Create the genesis block after the setup has finished or else it uses a potentially
        // wrong network config.
        genesisBlock = Block.fromData(require("../../utils/config/testnet/genesisBlock.json"));

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
            const processQueuePush = jest.spyOn(blockchain.queue, "push");

            const blocksToEnqueue = [blocks101to155[54]];
            blockchain.enqueueBlocks(blocksToEnqueue);
            expect(processQueuePush).toHaveBeenCalledWith(blocksToEnqueue);
        });
    });

    describe("processBlock", () => {
        const block3 = Block.fromData(blocks2to100[1]);
        let getLastBlock;
        let setLastBlock;
        beforeEach(() => {
            getLastBlock = jest.fn(() => block3);
            setLastBlock = jest.fn(() => null);
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

            await blockchain.processBlock(Block.fromData(blocks2to100[2]), mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should process a valid block already known", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
        });

        it("should broadcast a block if (slots.getSlotNumber() * blocktime <= block.data.timestamp)", async () => {
            blockchain.state.started = true;

            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            lastBlock.data.timestamp = slots.getSlotNumber() * 8000;

            const broadcastBlock = jest.spyOn(getMonitor, "broadcastBlock");

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(broadcastBlock).toHaveBeenCalled();
        });
    });

    describe("getLastBlock", () => {
        it("should be ok", () => {
            jest.spyOn(localConfig, "get").mockReturnValueOnce(50);
            blockchain.state.setLastBlock(genesisBlock);

            expect(blockchain.getLastBlock()).toEqual(genesisBlock);
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
                timestamp: slots.getEpochTime(),
            };

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
                timestamp: slots.getSlotTime(slots.getNextSlot()),
            };

            blockchain.handleIncomingBlock(block);

            expect(blockchain.dispatch).not.toHaveBeenCalled();
            expect(blockchain.enqueueBlocks).not.toHaveBeenCalled();

            blockchain.dispatch = dispatch;
            blockchain.enqueueBlocks = enqueueBlocks;
        });

        it("should disregard block when blockchain is not ready", async () => {
            blockchain.state.started = false;
            const loggerInfo = jest.spyOn(logger, "info");

            const mockGetSlotNumber = jest
                .spyOn(slots, "getSlotNumber")
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1);

            await blockchain.handleIncomingBlock(blocks101to155[54]);

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
            const forkedBlock = Block.fromData(blocks2to100[11]);
            expect(() => blockchain.forkBlock(forkedBlock)).toDispatch(blockchain, "FORK");
            expect(blockchain.state.forkedBlock).toBe(forkedBlock);

            blockchain.state.forkedBlock = null; // reset
        });
    });

    describe("isSynced", () => {
        describe("with a block param", () => {
            it("should be ok", () => {
                expect(
                    blockchain.isSynced({
                        data: {
                            timestamp: slots.getTime(),
                            height: genesisBlock.height,
                        },
                    } as interfaces.IBlock),
                ).toBeTrue();
            });
        });

        describe("without a block param", () => {
            it("should use the last block", () => {
                jest.spyOn(getStorage, "hasPeers").mockReturnValueOnce(true);
                const getLastBlock = jest.spyOn(blockchain, "getLastBlock").mockReturnValueOnce({
                    // @ts-ignore
                    data: {
                        timestamp: slots.getTime(),
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
            blockchain.state.blockPing = null;

            // returns false if no state.blockPing
            expect(blockchain.pingBlock(blocks2to100[3])).toBeFalse();
        });
    });

    describe("pushPingBlock", () => {
        it("should call state.pushPingBlock", () => {
            blockchain.state.blockPing = null;

            blockchain.pushPingBlock(blocks2to100[3]);
            expect(blockchain.state.blockPing).toBeObject();
            expect(blockchain.state.blockPing.block).toBe(blocks2to100[3]);
        });
    });

    describe("constructor - networkStart", () => {
        it("should output log messages if launched in networkStart mode", async () => {
            const loggerWarn = jest.spyOn(logger, "warn");
            const loggerInfo = jest.spyOn(logger, "info");

            const blockchainNetworkStart = new Blockchain({ networkStart: true });

            expect(loggerWarn).toHaveBeenCalledWith(
                "Ark Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
            expect(loggerInfo).toHaveBeenCalledWith("Starting Ark Core for a new world, welcome aboard");
        });
    });
});
