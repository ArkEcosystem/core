/* tslint:disable:max-line-length */
import { Wallet } from "@arkecosystem/core-database";
import { Blocks, Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { asValue } from "awilix";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { defaults } from "../../../packages/core-blockchain/src/defaults";
import "../../utils";
import { blocks101to155 } from "../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { setUp, tearDown } from "./__support__/setup";

const { Block } = Blocks;

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
        genesisBlock = Block.fromData(require("../../utils/config/testnet/genesisBlock.json"));

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

    describe("restoreCurrentRound", () => {
        it("should restore the active delegates of the current round", async () => {
            await __resetToHeight1();

            // Go to arbitrary height in round 2.
            await __addBlocks(55);

            // Pretend blockchain just started
            await blockchain.database.restoreCurrentRound(blockchain.getLastHeight());
            const forgingDelegates = await blockchain.database.getActiveDelegates(blockchain.getLastHeight());
            expect(forgingDelegates).toHaveLength(51);

            // Reset again and replay to round 2. In both cases the forging delegates
            // have to match.
            await __resetToHeight1();
            await __addBlocks(52);

            // FIXME: using jest.spyOn getActiveDelegates with toHaveLastReturnedWith() somehow gets
            // overwritten in afterEach
            // FIXME: wallet.lastBlock needs to be properly restored when reverting
            forgingDelegates.forEach(forger => (forger.lastBlock = null));
            expect(forgingDelegates).toEqual(
                (blockchain.database as any).forgingDelegates.map(forger => {
                    forger.lastBlock = null;
                    return forger;
                }),
            );
        });
    });

    describe("rollback", () => {
        beforeEach(async () => {
            await __resetToHeight1();
            await __addBlocks(155);
        });

        const getNextForger = async () => {
            const lastBlock = blockchain.state.getLastBlock();
            const activeDelegates = await blockchain.database.getActiveDelegates(lastBlock.data.height);
            const nextSlot = Crypto.slots.getSlotNumber(lastBlock.data.timestamp) + 1;
            return activeDelegates[nextSlot % activeDelegates.length];
        };

        const createBlock = (generatorKeys: any, transactions: Interfaces.ITransactionData[]) => {
            const transactionData = {
                amount: Utils.Bignum.ZERO,
                fee: Utils.Bignum.ZERO,
                ids: [],
            };

            const sortedTransactions = Utils.sortTransactions(transactions);
            sortedTransactions.forEach(transaction => {
                transactionData.amount = transactionData.amount.plus(transaction.amount);
                transactionData.fee = transactionData.fee.plus(transaction.fee);
                transactionData.ids.push(Buffer.from(transaction.id, "hex"));
            });

            const lastBlock = blockchain.state.getLastBlock();
            const data = {
                timestamp: Crypto.slots.getSlotTime(Crypto.slots.getSlotNumber(lastBlock.data.timestamp) + 1),
                version: 0,
                previousBlock: lastBlock.data.id,
                previousBlockHex: lastBlock.data.idHex,
                height: lastBlock.data.height + 1,
                numberOfTransactions: sortedTransactions.length,
                totalAmount: transactionData.amount,
                totalFee: transactionData.fee,
                reward: Utils.Bignum.ZERO,
                payloadLength: 32 * sortedTransactions.length,
                payloadHash: Crypto.HashAlgorithms.sha256(transactionData.ids).toString("hex"),
                transactions: sortedTransactions,
            };

            return Block.create(data, Crypto.crypto.getKeys(generatorKeys.secret));
        };

        it("should restore vote balances after a rollback", async () => {
            const mockCallback = jest.fn(() => true);

            // Create key pair for new voter
            const keyPair = Crypto.crypto.getKeys("secret");
            const recipient = Crypto.crypto.getAddress(keyPair.publicKey);

            let nextForger = await getNextForger();
            const initialVoteBalance = nextForger.voteBalance;

            // First send funds to new voter wallet
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const transfer = Transactions.BuilderFactory.transfer()
                .recipientId(recipient)
                .amount(125)
                .sign(forgerKeys.passphrase)
                .getStruct();

            const transferBlock = createBlock(forgerKeys, [transfer]);
            await blockchain.processBlock(transferBlock, mockCallback);

            const wallet = blockchain.database.walletManager.findByPublicKey(keyPair.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);

            // New wallet received funds and vote balance of delegate has been reduced by the same amount,
            // since it forged it's own transaction the fees for the transaction have been recovered.
            expect(wallet.balance).toEqual(new Utils.Bignum(transfer.amount));
            expect(walletForger.voteBalance).toEqual(new Utils.Bignum(initialVoteBalance).minus(transfer.amount));

            // Now vote with newly created wallet for previous forger.
            const vote = Transactions.BuilderFactory.vote()
                .fee(1)
                .votesAsset([`+${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            let nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const voteBlock = createBlock(nextForgerWallet, [vote]);
            await blockchain.processBlock(voteBlock, mockCallback);

            // Wallet paid a fee of 1 and the vote has been placed.
            expect(wallet.balance).toEqual(new Utils.Bignum(124));
            expect(wallet.vote).toEqual(forgerKeys.publicKey);

            // Vote balance of delegate now equals initial vote balance minus 1 for the vote fee
            // since it was forged by a different delegate.
            expect(walletForger.voteBalance).toEqual(new Utils.Bignum(initialVoteBalance).minus(vote.fee));

            // Now unvote again
            const unvote = Transactions.BuilderFactory.vote()
                .fee(1)
                .votesAsset([`-${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const unvoteBlock = createBlock(nextForgerWallet, [unvote]);
            await blockchain.processBlock(unvoteBlock, mockCallback);

            // Wallet paid a fee of 1 and no longer voted a delegate
            expect(wallet.balance).toEqual(new Utils.Bignum(123));
            expect(wallet.vote).toBeNull();

            // Vote balance of delegate now equals initial vote balance minus the amount sent to the voter wallet.
            expect(walletForger.voteBalance).toEqual(new Utils.Bignum(initialVoteBalance).minus(transfer.amount));

            // Now rewind 3 blocks back to the initial state
            await blockchain.removeBlocks(3);

            // Wallet is now a cold wallet and the initial vote balance has been restored.
            expect(wallet.balance).toEqual(Utils.Bignum.ZERO);
            expect(walletForger.voteBalance).toEqual(new Utils.Bignum(initialVoteBalance));
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
        const generator = Crypto.crypto.getAddress(genesisBlock.data.generatorPublicKey);
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
        const blockToProcess = Block.fromData(allBlocks[height - 2]);
        await blockchain.processBlock(blockToProcess, () => null);
    }
}
