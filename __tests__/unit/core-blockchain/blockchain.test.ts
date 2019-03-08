/* tslint:disable:max-line-length */
import { crypto, models, slots } from "@arkecosystem/crypto";
import { asValue } from "awilix";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { defaults } from "../../../packages/core-blockchain/src/defaults";
import "../../utils";
import { blocks101to155 } from "../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { setUp, tearDown } from "./__support__/setup";

const { Block, Wallet } = models;

let genesisBlock;
let configManager;
let container;
let blockchain: Blockchain;
let loggerDebugBackup;

describe("Blockchain", () => {
    let logger;
    beforeAll(async () => {
        container = await setUp();

        // Backup logger.debug function as we are going to mock it in the test suite
        logger = container.resolvePlugin("logger");
        loggerDebugBackup = logger.debug;

        // Create the genesis block after the setup has finished or else it uses a potentially
        // wrong network config.
        genesisBlock = new Block(require("../../utils/config/testnet/genesisBlock.json"));

        configManager = container.getConfig();

        // Manually register the blockchain and start it
        await __start(false);
    });

    afterAll(async () => {
        await __resetToHeight1();

        // Manually stop the blockchain
        await blockchain.stop();

        await tearDown();
    });

    afterEach(async () => {
        // Restore original logger.debug function
        logger.debug = loggerDebugBackup;

        await __resetToHeight1();
        await __addBlocks(5);
        await __resetBlocksInCurrentRound();
    });

    describe("dispatch", () => {
        it("should be ok", () => {
            const nextState = blockchain.dispatch("START");

            expect(blockchain.state.blockchain).toEqual(nextState);
        });
    });

    describe("start", () => {
        it("should be ok", async () => {
            process.env.CORE_SKIP_BLOCKCHAIN = "false";

            const started = await blockchain.start(true);

            expect(started).toBeTrue();
        });
    });

    describe("checkNetwork", () => {
        it("should throw an exception", () => {
            expect(() => blockchain.checkNetwork()).toThrow("Method [checkNetwork] not implemented!");
        });
    });

    describe("updateNetworkStatus", () => {
        it("should call p2p updateNetworkStatus", async () => {
            const p2pUpdateNetworkStatus = jest.spyOn(blockchain.p2p, "updateNetworkStatus");

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
        it("should process a new chained block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.state.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(blockchain.getLastBlock()).not.toEqual(lastBlock);

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
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
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            lastBlock.data.timestamp =
                slots.getSlotNumber() * configManager.getMilestone(lastBlock.data.height).blocktime;

            const broadcastBlock = jest.spyOn(blockchain.p2p, "broadcastBlock");

            await blockchain.processBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(broadcastBlock).toHaveBeenCalled();
        });
    });

    describe("getLastBlock", () => {
        it("should be ok", () => {
            blockchain.state.setLastBlock(genesisBlock);

            expect(blockchain.getLastBlock()).toEqual(genesisBlock);
        });
    });

    describe("handleIncomingBlock", () => {
        it("should be ok", () => {
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
            const forkedBlock = new Block(blocks2to100[11]);
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
                    } as models.IBlock),
                ).toBeTrue();
            });
        });

        describe("without a block param", () => {
            it("should use the last block", () => {
                jest.spyOn(blockchain.p2p, "hasPeers").mockReturnValueOnce(true);
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

    describe("getEvents", () => {
        it("should return the events", () => {
            expect(blockchain.getEvents()).toEqual([
                "block.applied",
                "block.forged",
                "block.reverted",
                "delegate.registered",
                "delegate.resigned",
                "forger.failed",
                "forger.missing",
                "forger.started",
                "peer.added",
                "peer.removed",
                "round.created",
                "state:started",
                "transaction.applied",
                "transaction.expired",
                "transaction.forged",
                "transaction.reverted",
                "wallet.saved",
                "wallet.created.cold",
            ]);
        });
    });
});

async function __start(networkStart) {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";
    process.env.CORE_ENV = "false";

    const plugin = require("../../../packages/core-blockchain/src").plugin;

    blockchain = await plugin.register(container, {
        networkStart,
        ...defaults,
    });

    await container.register(
        "blockchain",
        asValue({
            name: "blockchain",
            version: "0.1.0",
            plugin: blockchain,
            options: {},
        }),
    );

    if (networkStart) {
        return;
    }

    await __resetToHeight1();

    await blockchain.start();
    await __addBlocks(5);
}

async function __resetBlocksInCurrentRound() {
    await blockchain.database.loadBlocksFromCurrentRound();
}

async function __resetToHeight1() {
    const lastBlock = await blockchain.database.getLastBlock();
    if (lastBlock) {
        // Make sure the wallet manager has been fed or else revertRound
        // cannot determine the previous delegates. This is only necessary, because
        // the database is not dropped after the unit tests are done.
        await blockchain.database.buildWallets(lastBlock.data.height);

        // Index the genesis wallet or else revert block at height 1 fails
        const generator = crypto.getAddress(genesisBlock.data.generatorPublicKey);
        const genesis = new Wallet(generator);
        genesis.publicKey = genesisBlock.data.generatorPublicKey;
        genesis.username = "genesis";
        blockchain.database.walletManager.reindex(genesis);

        blockchain.state.clear();

        blockchain.state.setLastBlock(lastBlock);
        await __resetBlocksInCurrentRound();
        await blockchain.removeBlocks(lastBlock.data.height - 1);
    }
}

async function __addBlocks(untilHeight) {
    const allBlocks = [...blocks2to100, ...blocks101to155];
    const lastHeight = blockchain.getLastHeight();

    for (let height = lastHeight + 1; height < untilHeight && height < 155; height++) {
        const blockToProcess = new Block(allBlocks[height - 2]);
        await blockchain.processBlock(blockToProcess, () => null);
    }
}
