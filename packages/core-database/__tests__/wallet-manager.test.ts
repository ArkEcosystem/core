/* tslint:disable:max-line-length no-empty */
import { Database } from "@arkecosystem/core-interfaces";
import { fixtures, generators } from "@arkecosystem/core-test-utils";
import { Bignum, constants, crypto, models, transactionBuilder } from "@arkecosystem/crypto";
import { IMultiSignatureAsset } from "@arkecosystem/crypto/dist/models";
import genesisBlockTestnet from "../../core-test-utils/src/config/testnet/genesisBlock.json";
import wallets from "./__fixtures__/wallets.json";
import { setUp, tearDown } from "./__support__/setup";

const { Block, Transaction, Wallet } = models;
const { SATOSHI, TransactionTypes } = constants;

const { generateDelegateRegistration, generateSecondSignature, generateTransfers, generateVote } = generators;

const block3 = fixtures.blocks2to100[1];
const block = new Block(block3);

const walletData1 = wallets[0];
const walletData2 = wallets[1];

let genesisBlock;
let walletManager: Database.IWalletManager;

beforeAll(async done => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(genesisBlockTestnet);

    const { WalletManager } = require("../src/wallet-manager");
    walletManager = new WalletManager();

    done();
});

beforeEach(() => {
    const { WalletManager } = require("../src/wallet-manager");
    walletManager = new WalletManager();
});

afterAll(async done => {
    await tearDown();

    done();
});

describe("Wallet Manager", () => {
    describe("reset", () => {
        it("should reset the index", () => {
            const wallet = new Wallet(walletData1.address);

            walletManager.reindex(wallet);
            expect(walletManager.allByAddress()).toEqual([wallet]);

            walletManager.reset();
            expect(walletManager.allByAddress()).toEqual([]);
        });
    });

    describe("reindex", () => {
        it("should index the wallets", () => {
            const wallet = new Wallet(walletData1.address);

            expect(walletManager.allByAddress()).toEqual([]);

            walletManager.reindex(wallet);
            expect(walletManager.allByAddress()).toEqual([wallet]);
        });
    });

    describe("applyBlock", () => {
        let delegateMock;
        let block2;

        const delegatePublicKey = block3.generatorPublicKey; // '0299deebff24ebf2bb53ad78f3ea3ada5b3c8819132e191b02c263ee4aa4af3d9b'

        const txs = [];
        for (let i = 0; i < 3; i++) {
            txs[i] = transactionBuilder
                .vote()
                .sign(Math.random().toString(36))
                .votesAsset([`+${delegatePublicKey}`])
                .build();
        }

        beforeEach(() => {
            delegateMock = { applyBlock: jest.fn(), publicKey: delegatePublicKey };
            // @ts-ignore
            jest.spyOn(walletManager, "findByPublicKey").mockReturnValue(delegateMock);
            jest.spyOn(walletManager, "applyTransaction").mockImplementation();
            jest.spyOn(walletManager, "revertTransaction").mockImplementation();

            const { data } = block;
            data.transactions = [];
            data.transactions.push(txs[0]);
            data.transactions.push(txs[1]);
            data.transactions.push(txs[2]);
            block2 = new Block(data);

            walletManager.reindex(delegateMock);
        });

        it("should apply sequentially the transactions of the block", async () => {
            await walletManager.applyBlock(block2);

            block2.transactions.forEach((transaction, i) => {
                expect(walletManager.applyTransaction).toHaveBeenNthCalledWith(i + 1, block2.transactions[i]);
            });
        });

        it("should apply the block data to the delegate", async () => {
            await walletManager.applyBlock(block);

            expect(delegateMock.applyBlock).toHaveBeenCalledWith(block.data);
        });

        describe("when 1 transaction fails while applying it", () => {
            it("should revert sequentially (from last to first) all the transactions of the block", async () => {
                // @ts-ignore
                jest.spyOn(walletManager, "applyTransaction").mockImplementation(tx => {
                    if (tx === block2.transactions[2]) {
                        throw new Error("Fake error");
                    }
                });

                expect(block2.transactions.length).toBe(3);

                try {
                    await walletManager.applyBlock(block2);

                    expect(null).toBe("this should fail if no error is thrown");
                } catch (error) {
                    expect(walletManager.revertTransaction).toHaveBeenCalledTimes(2);
                    block2.transactions.slice(0, 1).forEach((transaction, i, total) => {
                        expect(walletManager.revertTransaction).toHaveBeenNthCalledWith(
                            total.length + 1 - i,
                            block2.transactions[i],
                        );
                    });
                }
            });

            it("throws the Error", async () => {
                walletManager.applyTransaction = jest.fn(tx => {
                    throw new Error("Fake error");
                });

                try {
                    await walletManager.applyBlock(block2);

                    expect(null).toBe("this should fail if no error is thrown");
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect(error.message).toBe("Fake error");
                }
            });
        });

        describe.skip("the delegate of the block is not indexed", () => {
            describe("not genesis block", () => {
                it("throw an Error", () => {});
            });

            describe("genesis block", () => {
                it("generates a new wallet", () => {});
            });
        });
    });

    describe.skip("revertBlock", () => {
        it("should revert all transactions of the block", () => {});

        it("should revert the block of the delegate", () => {});
    });

    describe("applyTransaction", () => {
        describe("when the recipient is a cold wallet", () => {});

        const transfer = generateTransfers("testnet", Math.random().toString(36), walletData2.address, 96579, 1)[0];
        const delegateReg = generateDelegateRegistration("testnet", Math.random().toString(36), 1)[0];
        const secondSign = generateSecondSignature("testnet", Math.random().toString(36), 1)[0];
        const vote = generateVote("testnet", Math.random().toString(36), walletData2.publicKey, 1)[0];
        describe.each`
            type          | transaction    | amount               | balanceSuccess              | balanceFail
            ${"transfer"} | ${transfer}    | ${new Bignum(96579)} | ${new Bignum(SATOSHI)}      | ${Bignum.ONE}
            ${"delegate"} | ${delegateReg} | ${Bignum.ZERO}       | ${new Bignum(30 * SATOSHI)} | ${Bignum.ONE}
            ${"2nd sign"} | ${secondSign}  | ${Bignum.ZERO}       | ${new Bignum(10 * SATOSHI)} | ${Bignum.ONE}
            ${"vote"}     | ${vote}        | ${Bignum.ZERO}       | ${new Bignum(5 * SATOSHI)}  | ${Bignum.ONE}
        `("when the transaction is a $type", ({ type, transaction, amount, balanceSuccess, balanceFail }) => {
            let sender;
            let recipient;

            beforeEach(() => {
                sender = new Wallet(walletData1.address);
                recipient = new Wallet(walletData2.address);
                recipient.publicKey = walletData2.publicKey;

                sender.publicKey = transaction.senderPublicKey;

                walletManager.reindex(sender);
                walletManager.reindex(recipient);

                // @ts-ignore
                jest.spyOn(walletManager, "isDelegate").mockReturnValue(true);
            });

            it("should apply the transaction to the sender & recipient", async () => {
                sender.balance = balanceSuccess;

                expect(+sender.balance.toFixed()).toBe(+balanceSuccess);
                expect(+recipient.balance.toFixed()).toBe(0);

                await walletManager.applyTransaction(transaction);

                expect(sender.balance).toEqual(balanceSuccess.minus(amount).minus(transaction.fee));

                if (type === "transfer") {
                    expect(recipient.balance).toEqual(amount);
                }
            });

            it("should fail if the transaction cannot be applied", async () => {
                sender.balance = balanceFail;

                expect(+sender.balance.toFixed()).toBe(+balanceFail);
                expect(+recipient.balance.toFixed()).toBe(0);

                try {
                    expect(async () => {
                        await walletManager.applyTransaction(transaction);
                    }).toThrow(/apply transaction/);

                    expect(null).toBe("this should fail if no error is thrown");
                } catch (error) {
                    expect(+sender.balance.toFixed()).toBe(+balanceFail);
                    expect(+recipient.balance.toFixed()).toBe(0);
                }
            });
        });
    });

    describe("revertTransaction", () => {
        it("should revert the transaction from the sender & recipient", async () => {
            const transaction = new Transaction({
                type: TransactionTypes.Transfer,
                amount: new Bignum(245098000000000),
                fee: 0,
                recipientId: "AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
                timestamp: 0,
                asset: {},
                senderPublicKey: "035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788",
                signature:
                    "304402205fcb0677e06bde7aac3dc776665615f4b93ef8c3ed0fddecef9900e74fcb00f302206958a0c9868ea1b1f3d151bdfa92da1ce24de0b1fcd91933e64fb7971e92f48d",
                id: "db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd",
            });

            const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const recipient = walletManager.findByAddress(transaction.data.recipientId);
            recipient.balance = new Bignum(transaction.data.amount);

            expect(sender.balance).toEqual(Bignum.ZERO);
            expect(recipient.balance).toEqual(transaction.data.amount);

            await walletManager.revertTransaction(transaction);

            expect(sender.balance).toEqual(transaction.data.amount);
            expect(recipient.balance).toEqual(Bignum.ZERO);
        });
    });

    describe("findByAddress", () => {
        it("should return it by address", () => {
            const wallet = new Wallet(walletData1.address);

            walletManager.reindex(wallet);
            expect(walletManager.findByAddress(wallet.address).address).toBe(wallet.address);
        });
    });

    describe("findByPublicKey", () => {
        it("should return it by publicKey", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = "dummy-public-key";

            walletManager.reindex(wallet);
            expect(walletManager.findByPublicKey(wallet.publicKey).publicKey).toBe(wallet.publicKey);
        });
    });

    describe("findByUsername", () => {
        it("should return it by username", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.username = "dummy-username";

            walletManager.reindex(wallet);
            expect(walletManager.findByUsername(wallet.username).username).toBe(wallet.username);
        });
    });

    describe("all", () => {
        it("should return indexed", () => {
            const wallet1 = new Wallet(walletData1.address);
            walletManager.reindex(wallet1);

            const wallet2 = new Wallet(walletData2.address);
            walletManager.reindex(wallet2);

            expect(walletManager.allByAddress()).toEqual([wallet1, wallet2]);
        });
    });

    describe("canBePurged", () => {
        it("should be removed if all criteria are satisfied", async () => {
            const wallet = new Wallet(walletData1.address);

            expect(walletManager.canBePurged(wallet)).toBeTrue();
        });

        it("should not be removed if wallet.secondPublicKey is set", async () => {
            const wallet = new Wallet(walletData1.address);
            wallet.secondPublicKey = "secondPublicKey";

            expect(wallet.secondPublicKey).toBe("secondPublicKey");
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });

        it("should not be removed if wallet.multisignature is set", async () => {
            const wallet = new Wallet(walletData1.address);
            wallet.multisignature = {} as IMultiSignatureAsset;

            expect(wallet.multisignature).toEqual({});
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });

        it("should not be removed if wallet.username is set", async () => {
            const wallet = new Wallet(walletData1.address);
            wallet.username = "username";

            expect(wallet.username).toBe("username");
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });
    });

    describe("purgeEmptyNonDelegates", () => {
        it("should be purged if all criteria are satisfied", async () => {
            const wallet1 = new Wallet(walletData1.address);
            wallet1.publicKey = "dummy-1-publicKey";
            walletManager.reindex(wallet1);

            const wallet2 = new Wallet(walletData2.address);
            wallet2.username = "username";

            walletManager.reindex(wallet2);

            walletManager.purgeEmptyNonDelegates();

            expect(walletManager.allByAddress()).toEqual([wallet2]);
        });

        it("should not be purged if wallet.secondPublicKey is set", async () => {
            const wallet1 = new Wallet(walletData1.address);
            wallet1.publicKey = "dummy-1-publicKey";
            wallet1.secondPublicKey = "dummy-1-secondPublicKey";
            walletManager.reindex(wallet1);

            const wallet2 = new Wallet(walletData2.address);
            wallet2.username = "username";

            walletManager.reindex(wallet2);

            walletManager.purgeEmptyNonDelegates();

            expect(walletManager.allByAddress()).toEqual([wallet1, wallet2]);
        });

        it("should not be purged if wallet.multisignature is set", async () => {
            const wallet1 = new Wallet(walletData1.address);
            wallet1.publicKey = "dummy-1-publicKey";
            wallet1.multisignature = {} as IMultiSignatureAsset;
            walletManager.reindex(wallet1);

            const wallet2 = new Wallet(walletData2.address);
            wallet2.username = "username";

            walletManager.reindex(wallet2);

            walletManager.purgeEmptyNonDelegates();

            expect(walletManager.allByAddress()).toEqual([wallet1, wallet2]);
        });

        it("should not be purged if wallet.username is set", async () => {
            const wallet1 = new Wallet(walletData1.address);
            wallet1.publicKey = "dummy-1-publicKey";
            wallet1.username = "dummy-1-username";
            walletManager.reindex(wallet1);

            const wallet2 = new Wallet(walletData2.address);
            wallet2.username = "username";

            walletManager.reindex(wallet2);

            walletManager.purgeEmptyNonDelegates();

            expect(walletManager.allByAddress()).toEqual([wallet1, wallet2]);
        });
    });

    describe("buildVoteBalances", () => {
        it("should update vote balance of delegates", async () => {
            for (let i = 0; i < 5; i++) {
                const delegateKey = i.toString().repeat(66);
                const delegate = new Wallet(crypto.getAddress(delegateKey));
                delegate.publicKey = delegateKey;
                delegate.username = `delegate${i}`;
                delegate.voteBalance = Bignum.ZERO;

                const voter = new Wallet(crypto.getAddress((i + 5).toString().repeat(66)));
                voter.balance = new Bignum((i + 1) * 1000 * SATOSHI);
                voter.publicKey = `v${delegateKey}`;
                voter.vote = delegateKey;

                walletManager.index([delegate, voter]);
            }

            walletManager.buildVoteBalances();

            const delegates = walletManager.allByUsername();
            for (let i = 0; i < 5; i++) {
                const delegate = delegates[4 - i];
                expect(delegate.voteBalance).toEqual(new Bignum((5 - i) * 1000 * SATOSHI));
            }
        });
    });
});
