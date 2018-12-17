import "jest-extended";

import { Bignum, constants, models, transactionBuilder } from "@arkecosystem/crypto";
import { setUp, tearDown } from "./__support__/setup";

const { Block, Transaction, Wallet } = models;

const { ARKTOSHI, TransactionTypes } = constants;

let connectionInterface;
let genesisBlock;

import { DelegatesRepository } from "../src/repositories/delegates";
import { WalletsRepository } from "../src/repositories/wallets";
import { WalletManager } from "../src/wallet-manager";
import { DummyConnection } from "./__fixtures__/dummy-class";

beforeAll(async () => {
    await setUp();

    connectionInterface = new DummyConnection({});
    genesisBlock = new Block(require("@arkecosystem/core-test-utils/src/config/testnet/genesisBlock.json"));
});

afterAll(async () => {
    await tearDown();
});

describe("Connection Interface", () => {
    describe("getConnection", () => {
        it("should return the set connection", () => {
            connectionInterface.connection = "fake-connection";

            expect(connectionInterface.getConnection()).toBe("fake-connection");
        });
    });

    describe("__calcPreviousActiveDelegates", () => {
        it("should calculate the previous delegate list", async () => {
            const walletManager = new WalletManager();
            const initialHeight = 52;

            // Create delegates
            for (const transaction of genesisBlock.transactions) {
                if (transaction.type === TransactionTypes.DelegateRegistration) {
                    const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                    wallet.username = Transaction.deserialize(
                        transaction.serialized.toString("hex"),
                    ).asset.delegate.username;
                    walletManager.reindex(wallet);
                }
            }

            const keys = {
                passphrase: "this is a secret passphrase",
                publicKey: "02c71ab1a1b5b7c278145382eb0b535249483b3c4715a4fe6169d40388bbb09fa7",
                privateKey: "dcf4ead2355090279aefba91540f32e93b15c541ecb48ca73071f161b4f3e2e3",
                address: "D64cbDctaiADEH7NREnvRQGV27bnb1v2kE",
            };

            // Beginning of round 2 with all delegates 0 vote balance.
            const delegatesRound2 = walletManager.loadActiveDelegateList(51, initialHeight);

            // Prepare sender wallet
            const sender = new Wallet(keys.address);
            sender.publicKey = keys.publicKey;
            sender.canApply = jest.fn(() => true);
            walletManager.reindex(sender);

            // Apply 51 blocks, where each increases the vote balance of a delegate to
            // reverse the current delegate order.
            const blocksInRound = [];
            for (let i = 0; i < 51; i++) {
                const transfer = transactionBuilder
                    .transfer()
                    .amount(i * ARKTOSHI)
                    .recipientId(delegatesRound2[i].address)
                    .sign(keys.passphrase)
                    .build();

                // Vote for itself
                walletManager.byPublicKey[delegatesRound2[i].publicKey].vote = delegatesRound2[i].publicKey;

                const block = Block.create(
                    {
                        version: 0,
                        timestamp: 0,
                        height: initialHeight + i,
                        numberOfTransactions: 0,
                        totalAmount: transfer.amount,
                        totalFee: new Bignum(0.1),
                        reward: new Bignum(2),
                        payloadLength: 32 * 0,
                        payloadHash: "",
                        transactions: [transfer],
                    },
                    keys,
                );

                block.data.generatorPublicKey = keys.publicKey;
                walletManager.applyBlock(block);

                blocksInRound.push(block);
            }

            // The delegates from round 2 are now reversed in rank in round 3.
            const delegatesRound3 = walletManager.loadActiveDelegateList(51, initialHeight + 51);
            for (let i = 0; i < delegatesRound3.length; i++) {
                expect(delegatesRound3[i].rate).toBe(i + 1);
                expect(delegatesRound3[i].publicKey).toBe(delegatesRound2[delegatesRound3.length - i - 1].publicKey);
            }

            const connection = new DummyConnection({});
            connection.__getBlocksForRound = jest.fn(async () => blocksInRound);
            connection.walletManager = walletManager;

            // Necessary for revertRound to not blow up.
            walletManager.allByUsername = jest.fn(() => {
                const usernames = Object.values(walletManager.byUsername);
                usernames.push(sender);
                return usernames;
            });

            // Finally recalculate the round 2 list and compare against the original list
            const restoredDelegatesRound2 = await connection.__calcPreviousActiveDelegates(2);

            for (let i = 0; i < restoredDelegatesRound2.length; i++) {
                expect(restoredDelegatesRound2[i].rate).toBe(i + 1);
                expect(restoredDelegatesRound2[i].publicKey).toBe(delegatesRound2[i].publicKey);
            }
        });
    });

    describe("_registerWalletManager", () => {
        it("should register the wallet manager", () => {
            expect(connectionInterface.walletManager).toBeNull();

            connectionInterface._registerWalletManager();

            expect(connectionInterface.walletManager).toBeInstanceOf(WalletManager);
        });
    });

    describe("_registerRepositories", () => {
        it("should register the repositories", async () => {
            expect(connectionInterface.wallets).toBeNull();
            expect(connectionInterface.delegates).toBeNull();

            connectionInterface._registerRepositories();

            expect(connectionInterface.wallets).toBeInstanceOf(WalletsRepository);
            expect(connectionInterface.delegates).toBeInstanceOf(DelegatesRepository);
        });
    });
});
