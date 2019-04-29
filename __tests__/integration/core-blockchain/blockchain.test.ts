import "../../utils";

/* tslint:disable:max-line-length */
import { Wallets } from "@arkecosystem/core-state";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Blocks, Crypto, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import delay from "delay";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { genesisBlock as GB } from "../../utils/config/testnet/genesisBlock";
import { blocks101to155 } from "../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../utils/fixtures/testnet/blocks2to100";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { setUp, tearDown } from "./__support__/setup";

let genesisBlock;
let configManager;
let container;
let blockchain: Blockchain;

describe("Blockchain", () => {
    beforeAll(async () => {
        container = await setUp();

        blockchain = container.resolvePlugin("blockchain");

        // Create the genesis block after the setup has finished or else it uses a potentially
        // wrong network config.
        genesisBlock = Blocks.BlockFactory.fromData(GB);

        configManager = container.getConfig();

        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));
    });

    afterAll(async () => {
        configManager.set("exceptions.transactions", []);

        await __resetToHeight1();

        // Manually stop the blockchain
        await blockchain.stop();

        await tearDown();
    });

    afterEach(async () => {
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
            const roundInfo = roundCalculator.calculateRound(blockchain.getLastHeight());
            await blockchain.database.restoreCurrentRound(blockchain.getLastHeight());
            const forgingDelegates = await blockchain.database.getActiveDelegates(roundInfo);
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
            const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);
            const activeDelegates = await blockchain.database.getActiveDelegates(roundInfo);
            const nextSlot = Crypto.Slots.getSlotNumber(lastBlock.data.timestamp) + 1;
            return activeDelegates[nextSlot % activeDelegates.length];
        };

        const createBlock = (generatorKeys: any, transactions: Interfaces.ITransactionData[]) => {
            const transactionData = {
                amount: Utils.BigNumber.ZERO,
                fee: Utils.BigNumber.ZERO,
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
                timestamp: Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber(lastBlock.data.timestamp) + 1),
                version: 0,
                previousBlock: lastBlock.data.id,
                previousBlockHex: lastBlock.data.idHex,
                height: lastBlock.data.height + 1,
                numberOfTransactions: sortedTransactions.length,
                totalAmount: transactionData.amount,
                totalFee: transactionData.fee,
                reward: Utils.BigNumber.ZERO,
                payloadLength: 32 * sortedTransactions.length,
                payloadHash: Crypto.HashAlgorithms.sha256(transactionData.ids).toString("hex"),
                transactions: sortedTransactions,
            };

            return Blocks.BlockFactory.make(data, Identities.Keys.fromPassphrase(generatorKeys.secret));
        };

        it("should restore vote balances after a rollback", async () => {
            const mockCallback = jest.fn(() => true);

            // Create key pair for new voter
            const keyPair = Identities.Keys.fromPassphrase("secret");
            const recipient = Identities.Address.fromPublicKey(keyPair.publicKey);

            let nextForger = await getNextForger();
            const initialVoteBalance = nextForger.voteBalance;

            // First send funds to new voter wallet
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const transfer = Transactions.BuilderFactory.transfer()
                .recipientId(recipient)
                .amount("125")
                .sign(forgerKeys.passphrase)
                .getStruct();

            const transferBlock = createBlock(forgerKeys, [transfer]);
            await blockchain.processBlocks([transferBlock], mockCallback);

            const wallet = blockchain.database.walletManager.findByPublicKey(keyPair.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);

            // New wallet received funds and vote balance of delegate has been reduced by the same amount,
            // since it forged it's own transaction the fees for the transaction have been recovered.
            expect(wallet.balance).toEqual(transfer.amount);
            expect(walletForger.voteBalance).toEqual(initialVoteBalance.minus(transfer.amount));

            // Now vote with newly created wallet for previous forger.
            const vote = Transactions.BuilderFactory.vote()
                .fee("1")
                .votesAsset([`+${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            let nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const voteBlock = createBlock(nextForgerWallet, [vote]);
            await blockchain.processBlocks([voteBlock], mockCallback);

            // Wallet paid a fee of 1 and the vote has been placed.
            expect(wallet.balance).toEqual(Utils.BigNumber.make(124));
            expect(wallet.vote).toEqual(forgerKeys.publicKey);

            // Vote balance of delegate now equals initial vote balance minus 1 for the vote fee
            // since it was forged by a different delegate.
            expect(walletForger.voteBalance).toEqual(initialVoteBalance.minus(vote.fee));

            // Now unvote again
            const unvote = Transactions.BuilderFactory.vote()
                .fee("1")
                .votesAsset([`-${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const unvoteBlock = createBlock(nextForgerWallet, [unvote]);
            await blockchain.processBlocks([unvoteBlock], mockCallback);

            // Wallet paid a fee of 1 and no longer voted a delegate
            expect(wallet.balance).toEqual(Utils.BigNumber.make(123));
            expect(wallet.vote).toBeNull();

            // Vote balance of delegate now equals initial vote balance minus the amount sent to the voter wallet.
            expect(walletForger.voteBalance).toEqual(initialVoteBalance.minus(transfer.amount));

            // Now rewind 3 blocks back to the initial state
            await blockchain.removeBlocks(3);

            // Wallet is now a cold wallet and the initial vote balance has been restored.
            expect(wallet.balance).toEqual(Utils.BigNumber.ZERO);
            expect(walletForger.voteBalance).toEqual(initialVoteBalance);
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
        const generator = Identities.Address.fromPublicKey(genesisBlock.data.generatorPublicKey);
        const genesis = new Wallets.Wallet(generator);
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
        const blockToProcess = Blocks.BlockFactory.fromData(allBlocks[height - 2]);
        await blockchain.processBlocks([blockToProcess], () => null);
    }
}
