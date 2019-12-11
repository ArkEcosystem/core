/* tslint:disable:max-line-length no-empty */
import "../../core-database/mocks/core-container";

import { State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/src/errors";
import { Blocks, Constants, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Address } from "@arkecosystem/crypto/src/identities";
import { Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { fixtures } from "../../../utils";
import wallets from "../__fixtures__/wallets.json";

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

const { BlockFactory } = Blocks;
const { SATOSHI } = Constants;

const block3 = fixtures.blocks2to100[1];
const block = BlockFactory.fromData(block3);

const walletData1 = wallets[0];
const walletData2 = wallets[1];

let walletManager: State.IWalletManager;

beforeEach(() => {
    walletManager = new WalletManager();
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

    describe("block processing", () => {
        let delegateMock;
        let block2: Interfaces.IBlock;

        const delegatePublicKey = block3.generatorPublicKey; // '0299deebff24ebf2bb53ad78f3ea3ada5b3c8819132e191b02c263ee4aa4af3d9b'

        const txs: Interfaces.ITransaction[] = [];
        for (let i = 0; i < 3; i++) {
            txs[i] = Transactions.BuilderFactory.vote()
                .sign(Math.random().toString(36))
                .votesAsset([`+${delegatePublicKey}`])
                .build();
        }

        beforeEach(() => {
            delegateMock = {
                applyBlock: jest.fn(),
                revertBlock: jest.fn(),
                publicKey: delegatePublicKey,
                isDelegate: () => false,
                getAttribute: jest.fn(),
            };

            // @ts-ignore
            jest.spyOn(walletManager, "findByPublicKey").mockReturnValue(delegateMock);
            jest.spyOn(walletManager, "applyTransaction").mockImplementation();
            jest.spyOn(walletManager, "revertTransaction").mockImplementation();

            const { data } = block;
            data.transactions = [];
            data.transactions.push(txs[0].data);
            data.transactions.push(txs[1].data);
            data.transactions.push(txs[2].data);
            data.numberOfTransactions = 3; // NOTE: if transactions are added to a fixture the NoT needs to be increased
            block2 = BlockFactory.fromData(data);

            walletManager.reindex(delegateMock);
        });

        describe("applyBlock", () => {
            it("should apply sequentially the transactions of the block", async () => {
                await walletManager.applyBlock(block2);

                for (let i = 0; i < block2.transactions.length; i++) {
                    expect(walletManager.applyTransaction).toHaveBeenNthCalledWith(i + 1, block2.transactions[i]);
                }
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
                        expect(undefined).toBe("this should fail if no error is thrown");
                    } catch (error) {
                        expect(walletManager.revertTransaction).toHaveBeenCalledTimes(2);
                        for (const transaction of block2.transactions.slice(0, 1)) {
                            const i = block2.transactions.slice(0, 1).indexOf(transaction);
                            const total = block2.transactions.slice(0, 1).length;
                            expect(walletManager.revertTransaction).toHaveBeenNthCalledWith(
                                total + 1 - i,
                                block2.transactions[i],
                            );
                        }
                    }
                });

                it("throws the Error", async () => {
                    walletManager.applyTransaction = jest.fn(tx => {
                        throw new Error("Fake error");
                    });

                    try {
                        await walletManager.applyBlock(block2);

                        expect(undefined).toBe("this should fail if no error is thrown");
                    } catch (error) {
                        expect(error).toBeInstanceOf(Error);
                        expect(error.message).toBe("Fake error");
                    }
                });
            });

            it("should return the current block", async () => {
                expect(walletManager.getCurrentBlock()).toBeUndefined();

                const applyTransaction = jest
                    .spyOn(walletManager, "applyTransaction")
                    .mockImplementationOnce(async () => {
                        expect(walletManager.getCurrentBlock()).toBe(block2);
                    });

                await walletManager.applyBlock(block2);
                expect(applyTransaction).toHaveBeenCalled();
                expect(walletManager.getCurrentBlock()).toBeUndefined();
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

        describe("revertBlock", () => {
            it.todo("should revert all transactions of the block");

            it.todo("should revert the block of the delegate");

            it("should return the current block", async () => {
                expect(walletManager.getCurrentBlock()).toBeUndefined();

                const revertTransaction = jest
                    .spyOn(walletManager, "revertTransaction")
                    .mockImplementationOnce(async () => {
                        expect(walletManager.getCurrentBlock()).toBe(block2);
                    });

                await walletManager.revertBlock(block2);
                expect(revertTransaction).toHaveBeenCalled();
                expect(walletManager.getCurrentBlock()).toBeUndefined();
            });
        });
    });

    describe("applyTransaction", () => {
        it.todo("when the recipient is a cold wallet");

        const transfer = TransactionFactory.transfer(walletData2.address, 96579)
            .withNetwork("testnet")
            .withPassphrase(Math.random().toString(36))
            .build()[0];

        const delegateReg = TransactionFactory.delegateRegistration()
            .withNetwork("testnet")
            .withPassphrase(Math.random().toString(36))
            .build()[0];

        const secondSign = TransactionFactory.secondSignature()
            .withNetwork("testnet")
            .withPassphrase(Math.random().toString(36))
            .build()[0];

        const vote = TransactionFactory.vote(walletData2.publicKey)
            .withNetwork("testnet")
            .withPassphrase(Math.random().toString(36))
            .build()[0];

        describe.each`
            type          | transaction    | amount                         | balanceSuccess                        | balanceFail
            ${"transfer"} | ${transfer}    | ${Utils.BigNumber.make(96579)} | ${Utils.BigNumber.make(SATOSHI)}      | ${Utils.BigNumber.ONE}
            ${"delegate"} | ${delegateReg} | ${Utils.BigNumber.ZERO}        | ${Utils.BigNumber.make(30 * SATOSHI)} | ${Utils.BigNumber.ONE}
            ${"2nd sign"} | ${secondSign}  | ${Utils.BigNumber.ZERO}        | ${Utils.BigNumber.make(10 * SATOSHI)} | ${Utils.BigNumber.ONE}
            ${"vote"}     | ${vote}        | ${Utils.BigNumber.ZERO}        | ${Utils.BigNumber.make(5 * SATOSHI)}  | ${Utils.BigNumber.ONE}
        `("when the transaction is a $type", ({ type, transaction, amount, balanceSuccess, balanceFail }) => {
            let sender: State.IWallet;
            let recipient: State.IWallet;

            beforeEach(() => {
                sender = new Wallet(walletData1.address);
                recipient = new Wallet(walletData2.address);
                recipient.publicKey = walletData2.publicKey;

                sender.publicKey = transaction.data.senderPublicKey;

                walletManager.reindex(sender);
                walletManager.reindex(recipient);
            });

            it("should apply the transaction to the sender & recipient", async () => {
                sender.balance = balanceSuccess;

                expect(+sender.balance.toFixed()).toBe(+balanceSuccess);
                expect(+recipient.balance.toFixed()).toBe(0);

                if (type === "vote") {
                    recipient.setAttribute("delegate", {});
                }

                await walletManager.applyTransaction(transaction);

                expect(sender.balance).toEqual(balanceSuccess.minus(amount).minus(transaction.data.fee));

                if (type === "transfer") {
                    expect(recipient.balance).toEqual(amount);
                }
            });

            it("should fail if the transaction cannot be applied", async () => {
                sender.balance = balanceFail;

                expect(+sender.balance.toFixed()).toBe(+balanceFail);
                expect(+recipient.balance.toFixed()).toBe(0);

                try {
                    await expect(walletManager.applyTransaction(transaction)).rejects.toThrow(InsufficientBalanceError);
                    expect(undefined).toBe("this should fail if no error is thrown");
                } catch (error) {
                    expect(+sender.balance.toFixed()).toBe(+balanceFail);
                    expect(+recipient.balance.toFixed()).toBe(0);
                }
            });
        });
    });

    describe("revertTransaction", () => {
        it("should revert the transaction from the sender & recipient", async () => {
            const transaction = TransactionFactory.transfer("AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri", 245098000000000)
                .withFee(1 * 1e8)
                .withPassphrase("secret")
                .build()[0];

            const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.nonce = Utils.BigNumber.make(1);

            const recipient = walletManager.findByAddress(transaction.data.recipientId);
            recipient.balance = transaction.data.amount;

            expect(sender.balance).toEqual(Utils.BigNumber.ZERO);
            expect(recipient.balance).toEqual(transaction.data.amount);

            await walletManager.revertTransaction(transaction);

            expect(sender.balance).toEqual(transaction.data.amount.plus(transaction.data.fee));
            expect(recipient.balance).toEqual(Utils.BigNumber.ZERO);
        });

        it("should revert vote transaction and correctly update vote balances", async () => {
            const delegateKeys = Identities.Keys.fromPassphrase("delegate");
            const voterKeys = Identities.Keys.fromPassphrase("secret");

            const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
            delegate.balance = Utils.BigNumber.make(100_000_000);
            delegate.setAttribute("delegate", {
                username: "unittest",
                voteBalance: delegate.balance,
            });
            delegate.setAttribute("vote", delegate.publicKey);
            walletManager.reindex(delegate);

            const voter = walletManager.findByPublicKey(voterKeys.publicKey);
            voter.balance = Utils.BigNumber.make(100_000);

            const voteTransaction = Transactions.BuilderFactory.vote()
                .votesAsset([`+${delegateKeys.publicKey}`])
                .fee("125")
                .nonce("1")
                .sign("secret")
                .build();

            expect(delegate.balance).toEqual(Utils.BigNumber.make(100_000_000));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000),
            );
            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000));

            await walletManager.applyTransaction(voteTransaction);

            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000).minus(voteTransaction.data.fee));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000).plus(voter.balance),
            );
            await walletManager.revertTransaction(voteTransaction);

            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000),
            );
        });

        it("should revert unvote transaction and correctly update vote balances", async () => {
            const delegateKeys = Identities.Keys.fromPassphrase("delegate");
            const voterKeys = Identities.Keys.fromPassphrase("secret");

            const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
            delegate.balance = Utils.BigNumber.make(100_000_000);
            delegate.setAttribute("delegate", {
                username: "unittest",
                voteBalance: delegate.balance,
            });
            delegate.setAttribute("vote", delegate.publicKey);
            walletManager.reindex(delegate);

            const voter = walletManager.findByPublicKey(voterKeys.publicKey);
            voter.balance = Utils.BigNumber.make(100_000);

            const voteTransaction = Transactions.BuilderFactory.vote()
                .votesAsset([`+${delegateKeys.publicKey}`])
                .fee("125")
                .nonce("1")
                .sign("secret")
                .build();

            expect(delegate.balance).toEqual(Utils.BigNumber.make(100_000_000));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000),
            );
            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000));

            await walletManager.applyTransaction(voteTransaction);

            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000).minus(voteTransaction.data.fee));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000).plus(voter.balance),
            );

            const unvoteTransaction = Transactions.BuilderFactory.vote()
                .votesAsset([`-${delegateKeys.publicKey}`])
                .fee("125")
                .nonce("2")
                .sign("secret")
                .build();

            await walletManager.applyTransaction(unvoteTransaction);

            expect(voter.balance).toEqual(
                Utils.BigNumber.make(100_000)
                    .minus(voteTransaction.data.fee)
                    .minus(unvoteTransaction.data.fee),
            );
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000),
            );

            await walletManager.revertTransaction(unvoteTransaction);

            expect(voter.balance).toEqual(Utils.BigNumber.make(100_000).minus(voteTransaction.data.fee));
            expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                Utils.BigNumber.make(100_000_000).plus(voter.balance),
            );
        });
    });

    describe("index", () => {
        it("should register an index", () => {
            walletManager.registerIndex("customIndex", (index: State.IWalletIndex, wallet: State.IWallet): void => {
                if (wallet.hasAttribute("custom.attribute")) {
                    index.set(wallet.getAttribute("custom.attribute"), wallet);
                }
            });

            const wallet = new Wallet(walletData1.address);
            expect(() => wallet.setAttribute("custom.attribute", "something")).toThrow();

            const spy = jest.spyOn(Handlers.Registry, "isKnownWalletAttribute").mockReturnValue(true);

            expect(() => wallet.setAttribute("custom.attribute", "something")).not.toThrow();

            walletManager.reindex(wallet);

            expect(walletManager.findById("something")).toBe(wallet);

            spy.mockRestore();
        });

        it("should unregister an index", () => {
            expect(() => walletManager.unregisterIndex("custom")).toThrow();

            walletManager.registerIndex("custom", (index: State.IWalletIndex, wallet: State.IWallet): void => {});

            expect(() => walletManager.unregisterIndex("custom")).not.toThrow();
        });

        it("should get an index", () => {
            expect(() => walletManager.getIndex("custom")).toThrow();

            walletManager.registerIndex("custom", (index: State.IWalletIndex, wallet: State.IWallet): void => {});

            expect(() => walletManager.getIndex("custom")).not.toThrow();
        });
    });

    describe("find", () => {
        it("should return it by address", () => {
            const wallet = new Wallet(walletData1.address);

            walletManager.reindex(wallet);
            expect(walletManager.findByAddress(wallet.address).address).toBe(wallet.address);
        });

        it("should return it by publicKey", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = "dummy-public-key";

            walletManager.reindex(wallet);
            expect(walletManager.findByPublicKey(wallet.publicKey).publicKey).toBe(wallet.publicKey);
        });

        it("should return it by username", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate.username", "dummy-username");

            walletManager.reindex(wallet);
            expect(walletManager.findByUsername("dummy-username").getAttribute<string>("delegate.username")).toBe(
                "dummy-username",
            );
        });

        it("should return it by id", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = "dummy-public-key";
            wallet.setAttribute("delegate", { username: "delegate" });

            walletManager.reindex(wallet);
            expect(walletManager.findById(wallet.address)).toBe(wallet);
            expect(walletManager.findById(wallet.publicKey)).toBe(wallet);
            expect(walletManager.findById("delegate")).toBe(wallet);
        });

        it("should return it by index", () => {
            const wallet = new Wallet(walletData1.address);

            walletManager.reindex(wallet);

            expect(walletManager.findByIndex(State.WalletIndexes.Addresses, walletData1.address)).toBe(wallet);
        });
    });

    describe("getNonce", () => {
        it("should return nonce", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;
            wallet.nonce = Utils.BigNumber.make(5);

            walletManager.reindex(wallet);
            expect(walletManager.getNonce(walletData1.publicKey)).toEqual(Utils.BigNumber.make(5));
        });

        it("should return nonce when missing", () => {
            expect(walletManager.getNonce("missing")).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("forget", () => {
        it("should forget by address", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;

            walletManager.reindex(wallet);

            expect(walletManager.findByAddress(wallet.address)).toBe(wallet);

            walletManager.forgetByAddress(wallet.address);

            expect(walletManager.hasByAddress(wallet.address)).toBeFalse();
        });

        it("should forget by publicKey", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;

            walletManager.reindex(wallet);

            expect(walletManager.findByPublicKey(wallet.publicKey)).toBe(wallet);

            walletManager.forgetByPublicKey(wallet.publicKey);

            expect(walletManager.hasByPublicKey(wallet.publicKey)).toBeFalse();
        });

        it("should forget by username", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "delegate" });

            walletManager.reindex(wallet);

            expect(walletManager.findByUsername("delegate")).toBe(wallet);

            walletManager.forgetByUsername("delegate");

            expect(walletManager.hasByUsername("delegate")).toBeFalse();
        });

        it("should forget by index", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "delegate" });

            walletManager.reindex(wallet);

            expect(walletManager.findByUsername("delegate")).toBe(wallet);

            walletManager.forgetByIndex(State.WalletIndexes.Usernames, "delegate");

            expect(walletManager.hasByUsername("delegate")).toBeFalse();
        });
    });

    describe("has", () => {
        it("should have address", () => {
            const wallet = new Wallet(walletData1.address);

            expect(walletManager.hasByAddress(wallet.address)).toBeFalse();

            walletManager.reindex(wallet);

            expect(walletManager.hasByAddress(wallet.address)).toBeTrue();
        });

        it("should have address", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;

            expect(walletManager.hasByPublicKey(wallet.publicKey)).toBeFalse();

            walletManager.reindex(wallet);

            expect(walletManager.hasByPublicKey(wallet.publicKey)).toBeTrue();
        });

        it("should have username", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "delegate" });

            expect(walletManager.hasByUsername("delegate")).toBeFalse();

            walletManager.reindex(wallet);

            expect(walletManager.hasByUsername("delegate")).toBeTrue();
        });

        it("should have by index", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "delegate" });

            expect(walletManager.hasByIndex(State.WalletIndexes.Usernames, "delegate")).toBeFalse();

            walletManager.reindex(wallet);

            expect(walletManager.hasByIndex(State.WalletIndexes.Usernames, "delegate")).toBeTrue();
        });

        it("should have any", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;
            wallet.setAttribute("delegate", { username: "delegate" });

            expect(walletManager.has(walletData1.address)).toBeFalse();
            expect(walletManager.has(walletData1.publicKey)).toBeFalse();
            expect(walletManager.has("delegate")).toBeFalse();

            walletManager.reindex(wallet);

            expect(walletManager.has(walletData1.address)).toBeTrue();
            expect(walletManager.has(walletData1.publicKey)).toBeTrue();
            expect(walletManager.has("delegate")).toBeTrue();
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
            wallet.setAttribute("secondPublicKey", "secondPublicKey");

            expect(wallet.getAttribute<string>("secondPublicKey")).toBe("secondPublicKey");
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });

        it("should not be removed if wallet.multisignature is set", async () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("multiSignature", {});

            expect(wallet.getAttribute("multiSignature")).toEqual({});
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });

        it("should not be removed if wallet.username is set", async () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate.username", "username");

            expect(wallet.getAttribute<string>("delegate.username")).toBe("username");
            expect(walletManager.canBePurged(wallet)).toBeFalse();
        });
    });

    describe("buildVoteBalances", () => {
        it("should update vote balance of delegates", async () => {
            for (let i = 0; i < 5; i++) {
                const delegateKey = i.toString().repeat(66);
                const delegate = new Wallet(Address.fromPublicKey(delegateKey));
                delegate.publicKey = delegateKey;
                delegate.setAttribute("delegate.username", `delegate${i}`);
                delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

                const voter = new Wallet(Address.fromPublicKey((i + 5).toString().repeat(66)));
                voter.balance = Utils.BigNumber.make(i + 1)
                    .times(1000)
                    .times(SATOSHI);
                voter.publicKey = `v${delegateKey}`;
                voter.setAttribute("vote", delegateKey);

                walletManager.index([delegate, voter]);
            }

            walletManager.buildVoteBalances();

            const delegates = walletManager.allByUsername();
            for (let i = 0; i < 5; i++) {
                const delegate = delegates[4 - i];
                expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                    Utils.BigNumber.make(5 - i)
                        .times(1000)
                        .times(SATOSHI),
                );
            }
        });
    });

    describe("buildDelegateRanking", () => {
        it("should build ranking and sort delegates by vote balance", async () => {
            for (let i = 0; i < 5; i++) {
                const delegateKey = i.toString().repeat(66);
                const delegate = new Wallet(Identities.Address.fromPublicKey(delegateKey));
                delegate.publicKey = delegateKey;
                delegate.setAttribute("delegate.username", `delegate${i}`);
                delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

                const voter = new Wallet(Identities.Address.fromPublicKey((i + 5).toString().repeat(66)));
                voter.balance = Utils.BigNumber.make((i + 1) * 1000 * SATOSHI);
                voter.publicKey = `v${delegateKey}`;
                voter.setAttribute("vote", delegateKey);

                walletManager.index([delegate, voter]);
            }

            walletManager.buildVoteBalances();

            const delegates = walletManager.buildDelegateRanking();

            for (let i = 0; i < 5; i++) {
                const delegate = delegates[i];
                expect(delegate.getAttribute<number>("delegate.rank")).toEqual(i + 1);
                expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                    Utils.BigNumber.make((5 - i) * 1000 * SATOSHI),
                );
            }
        });
    });
});
