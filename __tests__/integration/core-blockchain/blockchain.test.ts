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

    describe("getUnconfirmedTransactions", () => {
        it("should get unconfirmed transactions", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const unconfirmedTransactions = blockchain.getUnconfirmedTransactions(200);

            expect(unconfirmedTransactions.transactions.length).toBe(transactionsWithoutType2.length);

            expect(unconfirmedTransactions.transactions).toEqual(
                transactionsWithoutType2.map(transaction => transaction.serialized.toString("hex")),
            );

            blockchain.transactionPool.flush();
        });

        it("should return object with count == -1 if getTransactionsForForging returned a falsy value", async () => {
            jest.spyOn(blockchain.transactionPool, "getTransactionsForForging").mockReturnValueOnce(null);

            const unconfirmedTransactions = blockchain.getUnconfirmedTransactions(200);
            expect(unconfirmedTransactions.count).toBe(-1);
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
        await blockchain.database.buildWallets();

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
