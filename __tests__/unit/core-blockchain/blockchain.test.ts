/* tslint:disable:max-line-length */
import "@arkecosystem/core-test-utils";
import { blocks101to155 } from "@arkecosystem/core-test-utils/src/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "@arkecosystem/core-test-utils/src/fixtures/testnet/blocks2to100";
import { crypto, models, slots } from "@arkecosystem/crypto";
import { asValue } from "awilix";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { defaults } from "../../../packages/core-blockchain/src/defaults";
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
        genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));

        configManager = container.getConfig();

        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));

        // Manually register the blockchain and start it
        await __start(false);
    });

    afterAll(async () => {
        configManager.set("exceptions.transactions", []);

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

    describe("rebuild", () => {
        it("should throw an exception", () => {
            expect(() => blockchain.rebuild()).toThrow("Method [rebuild] not implemented!");
        });
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const transactions = blockchain.transactionPool.getTransactions(0, 200);

            expect(transactions.length).toBe(transactionsWithoutType2.length);

            expect(transactions).toEqual(transactionsWithoutType2.map(transaction => transaction.serialized));

            blockchain.transactionPool.flush();
        });
    });

    describe("enQueueBlocks", () => {
        it("should just return if blocks provided are an empty array", async () => {
            const processQueuePush = jest.spyOn(blockchain.processQueue, "push");

            blockchain.enqueueBlocks([]);
            expect(processQueuePush).not.toHaveBeenCalled();
        });

        it("should enqueue the blocks provided", async () => {
            const processQueuePush = jest.spyOn(blockchain.processQueue, "push");

            const blocksToEnqueue = [blocks101to155[54]];
            blockchain.enqueueBlocks(blocksToEnqueue);
            expect(processQueuePush).toHaveBeenCalledWith(blocksToEnqueue);
        });
    });

    describe("rollbackCurrentRound", () => {
        it("should rollback", async () => {
            await __addBlocks(155);
            await blockchain.rollbackCurrentRound();
            expect(blockchain.getLastBlock().data.height).toBe(153);
        });

        it("shouldnt rollback more if previous round is round 2", async () => {
            await __addBlocks(140);
            await blockchain.rollbackCurrentRound();
            expect(blockchain.getLastBlock().data.height).toBe(102);

            await blockchain.rollbackCurrentRound();
            expect(blockchain.getLastBlock().data.height).toBe(102);
        });
    });

    describe("removeBlocks", () => {
        it("should remove blocks", async () => {
            const lastBlockHeight = blockchain.getLastBlock().data.height;

            await blockchain.removeBlocks(2);
            expect(blockchain.getLastBlock().data.height).toBe(lastBlockHeight - 2);
        });

        it("should remove (current height - 1) blocks if we provide a greater value", async () => {
            await __resetToHeight1();

            await blockchain.removeBlocks(9999);
            expect(blockchain.getLastBlock().data.height).toBe(1);
        });
    });

    describe("removeTopBlocks", () => {
        it("should remove top blocks", async () => {
            const dbLastBlockBefore = await blockchain.database.getLastBlock();
            const lastBlockHeight = dbLastBlockBefore.data.height;

            await blockchain.removeTopBlocks(2);
            const dbLastBlockAfter = await blockchain.database.getLastBlock();

            expect(dbLastBlockAfter.data.height).toBe(lastBlockHeight - 2);
        });
    });

    describe("rebuildBlock", () => {
        it("should rebuild with a known block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.rebuildBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
        });

        it("should rebuild with a new chained block", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(blockchain.getLastBlock()).not.toEqual(lastBlock);

            await blockchain.rebuildBlock(lastBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock()).toEqual(lastBlock);
        });

        it("should disregard block with height == last height but different id", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            const lastBlockCopy = new Block(lastBlock.data);
            lastBlockCopy.data.id = "123456";

            const loggerInfo = jest.spyOn(logger, "info");

            await blockchain.rebuildBlock(lastBlockCopy, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(loggerInfo).toHaveBeenCalledWith(
                `Block ${lastBlockCopy.data.height.toLocaleString()} disregarded because on a fork :knife_fork_plate:`,
            );
            expect(blockchain.getLastBlock().data.id).toBe(lastBlock.data.id);
        });

        it("should disregard block with height > last height + 1", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            const lastBlockCopy = new Block(lastBlock.data);
            lastBlockCopy.data.height += 2;

            await blockchain.rebuildBlock(lastBlockCopy, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(blockchain.getLastBlock().data.id).toBe(lastBlock.data.id);
            expect(blockchain.state.lastDownloadedBlock).toBe(lastBlock);
        });

        it("should disregard block not verified", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            const lastBlockCopy = new Block(lastBlock.data);
            lastBlockCopy.verification.verified = false;

            const loggerWarn = jest.spyOn(logger, "warn");

            await blockchain.rebuildBlock(lastBlockCopy, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(loggerWarn).toHaveBeenCalledWith(
                `Block ${lastBlockCopy.data.height.toLocaleString()} disregarded because verification failed :scroll:`,
            );
            expect(blockchain.getLastBlock().data.id).toBe(lastBlock.data.id);
        });

        it("should commitQueuedQueries if block height % 20 000 == 0", async () => {
            const mockCallback = jest.fn(() => true);
            const lastBlock = blockchain.getLastBlock();
            const lastBlockHeight = lastBlock.data.height;
            const nextBlock = new Block(blocks2to100[lastBlock.data.height - 1]);
            lastBlock.data.height = 19999;
            nextBlock.data.height = 20000;

            const commitQueuedQueries = jest
                .spyOn(blockchain.database, "commitQueuedQueries")
                // @ts-ignore
                .mockReturnValueOnce(true);
            // @ts-ignore
            jest.spyOn(blockchain.database, "enqueueSaveBlock").mockReturnValueOnce(true);

            await blockchain.rebuildBlock(nextBlock, mockCallback);
            await delay(200);

            expect(mockCallback.mock.calls.length).toBe(1);
            expect(commitQueuedQueries).toHaveBeenCalled();
            expect(blockchain.getLastBlock().data.id).toBe(nextBlock.data.id);

            // reset to "stable" state
            lastBlock.data.height = lastBlockHeight;
            blockchain.state.setLastBlock(lastBlock);
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

    describe("acceptChainedBlock", () => {
        it.skip("should process a new chained block", async () => {
            const lastBlock = blockchain.getLastBlock();

            await blockchain.removeBlocks(1); // remove 1 block so that we can add it then as a chained block

            expect(await blockchain.database.getLastBlock()).not.toEqual(lastBlock);

            // await blockchain.acceptChainedBlock(lastBlock);

            expect(await blockchain.database.getLastBlock()).toEqual(lastBlock);

            // manually set lastBlock because acceptChainedBlock doesn't do it
            blockchain.state.setLastBlock(lastBlock);
        });
    });

    describe("manageUnchainedBlock", () => {
        it.skip("should process a new unchained block", async () => {
            const mockLoggerDebug = jest.fn(message => true);
            logger.debug = mockLoggerDebug;

            const lastBlock = blockchain.getLastBlock();
            await blockchain.removeBlocks(2); // remove 2 blocks so that we can have _lastBlock_ as an unchained block
            // await blockchain.manageUnchainedBlock(lastBlock);

            expect(mockLoggerDebug).toHaveBeenCalled();

            const debugMessage = `Blockchain not ready to accept new block at height ${lastBlock.data.height.toLocaleString()}. Last block: ${(
                lastBlock.data.height - 2
            ).toLocaleString()} :warning:`;
            expect(mockLoggerDebug).toHaveBeenCalledWith(debugMessage);

            expect(blockchain.getLastBlock().data.height).toBe(lastBlock.data.height - 2);
        });
    });

    describe("getUnconfirmedTransactions", () => {
        it("should get unconfirmed transactions", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const unconfirmedTransactions = blockchain.getUnconfirmedTransactions(200);

            expect(unconfirmedTransactions.transactions.length).toBe(transactionsWithoutType2.length);

            expect(unconfirmedTransactions.transactions).toEqual(
                transactionsWithoutType2.map(transaction => transaction.serialized),
            );

            blockchain.transactionPool.flush();
        });

        it("should return object with count == -1 if getTransactionsForForging returned a falsy value", async () => {
            jest.spyOn(blockchain.transactionPool, "getTransactionsForForging").mockReturnValueOnce(null);

            const unconfirmedTransactions = blockchain.getUnconfirmedTransactions(200);
            expect(unconfirmedTransactions.count).toBe(-1);
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

            expect(loggerInfo).toHaveBeenCalledWith("Block disregarded because blockchain is not ready :exclamation:");
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

    describe("isRebuildSynced", () => {
        describe("with a block param", () => {
            it("should be ok", () => {
                jest.spyOn(blockchain.p2p, "hasPeers").mockReturnValueOnce(true);
                expect(
                    blockchain.isRebuildSynced({
                        data: {
                            timestamp: slots.getTime() - 3600 * 24 * 6,
                            height: blocks101to155[52].height,
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
                expect(blockchain.isRebuildSynced()).toBeTrue();
                expect(getLastBlock).toHaveBeenCalled();
            });
        });

        it("should return true when there is no peer", () => {
            jest.spyOn(blockchain.p2p, "hasPeers").mockReturnValueOnce(false);

            expect(blockchain.isRebuildSynced()).toBeTrue();
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

    describe("__registerQueue", () => {
        it("should be ok", () => {
            blockchain.__registerQueue();

            expect(blockchain).toHaveProperty("queue");
            expect(blockchain).toHaveProperty("processQueue");
            expect(blockchain).toHaveProperty("rebuildQueue");
        });
    });

    describe("stop on emit shutdown", () => {
        it("should trigger the stop method when receiving 'shutdown' event", async () => {
            const emitter = container.resolvePlugin("event-emitter");

            // @ts-ignore
            const stop = jest.spyOn(blockchain, "stop").mockReturnValue(true);

            emitter.emit("shutdown");

            await delay(200);

            expect(stop).toHaveBeenCalled();
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
