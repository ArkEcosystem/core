import "jest-extended";

import { Contracts } from "@packages/core-kernel/src";
import { BlockState } from "@packages/core-state/src/block-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Wallet } from "@packages/core-state/src/wallets";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Enums, Interfaces, Utils } from "@packages/crypto";

import { makeChainedBlocks } from "./__utils__/make-chained-block";
import { makeVoteTransactions } from "./__utils__/make-vote-transactions";
import { addTransactionsToBlock } from "./__utils__/transactions";
import { setUp, setUpDefaults } from "./setup";

let blockState: BlockState;
let stateStore: StateStore;
let factory: FactoryBuilder;
let blocks: Interfaces.IBlock[];
let walletRepo: WalletRepository;
let forgingWallet: Contracts.State.Wallet;
let votingWallet: Contracts.State.Wallet;
let sendingWallet: Contracts.State.Wallet;
let recipientWallet: Contracts.State.Wallet;
let recipientsDelegate: Contracts.State.Wallet;

let applySpy: jest.SpyInstance;
let revertSpy: jest.SpyInstance;
let spyApplyTransaction: jest.SpyInstance;
let spyRevertTransaction: jest.SpyInstance;
let spyIncreaseWalletDelegateVoteBalance: jest.SpyInstance;
let spyInitGenesisForgerWallet: jest.SpyInstance;
let spyApplyBlockToForger: jest.SpyInstance;
let spyDecreaseWalletDelegateVoteBalance: jest.SpyInstance;
let spyApplyVoteBalances: jest.SpyInstance;
let spyRevertVoteBalances: jest.SpyInstance;
let spyRevertBlockFromForger: jest.SpyInstance;

const forgetWallet = (wallet: Wallet) => {
    for (const indexName of walletRepo.getIndexNames()) {
        const index = walletRepo.getIndex(indexName);

        index.forgetWallet(wallet);
    }
};

beforeAll(async () => {
    const initialEnv = await setUp(setUpDefaults, true); // todo: why do I have to skip booting?
    walletRepo = initialEnv.walletRepo;
    blockState = initialEnv.blockState;
    stateStore = initialEnv.stateStore;
    factory = initialEnv.factory;
    applySpy = initialEnv.spies.applySpy;
    revertSpy = initialEnv.spies.revertSpy;
});

beforeEach(() => {
    blocks = makeChainedBlocks(101, factory.get("Block"));

    spyApplyTransaction = jest.spyOn(blockState, "applyTransaction");
    spyRevertTransaction = jest.spyOn(blockState, "revertTransaction");
    spyIncreaseWalletDelegateVoteBalance = jest.spyOn(blockState, "increaseWalletDelegateVoteBalance");
    spyDecreaseWalletDelegateVoteBalance = jest.spyOn(blockState, "decreaseWalletDelegateVoteBalance");
    spyInitGenesisForgerWallet = jest.spyOn(blockState as any, "initGenesisForgerWallet");
    spyApplyBlockToForger = jest.spyOn(blockState as any, "applyBlockToForger");
    spyApplyVoteBalances = jest.spyOn(blockState as any, "applyVoteBalances");
    spyRevertVoteBalances = jest.spyOn(blockState as any, "revertVoteBalances");
    spyRevertBlockFromForger = jest.spyOn(blockState as any, "revertBlockFromForger");

    forgingWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

    forgingWallet.setAttribute("delegate", {
        username: "test",
        forgedFees: Utils.BigNumber.ZERO,
        forgedRewards: Utils.BigNumber.ZERO,
        producedBlocks: 0,
        lastBlock: undefined,
    });

    votingWallet = factory
        .get("Wallet")
        .withOptions({
            passphrase: "testPassphrase1",
            nonce: 0,
        })
        .make();

    sendingWallet = factory
        .get("Wallet")
        .withOptions({
            passphrase: "testPassphrase1",
            nonce: 0,
        })
        .make();

    recipientWallet = factory
        .get("Wallet")
        .withOptions({
            passphrase: "testPassphrase2",
            nonce: 0,
        })
        .make();

    recipientsDelegate = factory
        .get("Wallet")
        .withOptions({
            passphrase: "recipientDelegate",
            nonce: 0,
        })
        .make();

    recipientsDelegate.setAttribute("delegate", {
        username: "test2",
        forgedFees: Utils.BigNumber.ZERO,
        forgedRewards: Utils.BigNumber.ZERO,
        producedBlocks: 0,
        lastBlock: undefined,
    });
    recipientsDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

    walletRepo.index([votingWallet, forgingWallet, sendingWallet, recipientWallet, recipientsDelegate]);

    addTransactionsToBlock(
        makeVoteTransactions(3, [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]),
        blocks[0],
    );
});

afterEach(() => {
    walletRepo.reset();

    jest.clearAllMocks();
    spyApplyTransaction.mockRestore();
    spyRevertTransaction.mockRestore();
});

describe("BlockState", () => {
    it("should apply sequentially the transactions of the block", async () => {
        stateStore.getLastBlock = jest.fn().mockReturnValue(blocks[0]);

        await blockState.applyBlock(blocks[1]);

        for (let i = 0; i < blocks[1].transactions.length; i++) {
            expect(spyApplyTransaction).toHaveBeenNthCalledWith(i + 1, blocks[0].transactions[i]);
        }
    });

    it("should call the handler for each transaction", async () => {
        stateStore.getLastBlock = jest.fn().mockReturnValue(blocks[0]);

        await blockState.applyBlock(blocks[1]);

        expect(applySpy).toHaveBeenCalledTimes(blocks[1].transactions.length);
        expect(revertSpy).not.toHaveBeenCalled();
    });

    it("should init foring wallet on genesis block", async () => {
        stateStore.getLastBlock = jest.fn().mockReturnValue(blocks[0]);

        blocks[0].data.height = 1;
        await blockState.applyBlock(blocks[0]);
        expect(spyInitGenesisForgerWallet).toHaveBeenCalledWith(blocks[0].data.generatorPublicKey);
    });

    describe("voteBalances", () => {
        it("should not update vote balances if wallet hasn't voted", () => {
            const voteBalanceBefore = Utils.BigNumber.ZERO;

            forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

            const voteWeight = Utils.BigNumber.make(5678);

            blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

            const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

            expect(voteBalanceAfter).toEqual(voteBalanceBefore);
        });

        it("should update vote balances", () => {
            const voteBalanceBefore = Utils.BigNumber.ZERO;

            forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

            const voteWeight = Utils.BigNumber.make(5678);

            votingWallet.setBalance(voteWeight);

            votingWallet.setAttribute("vote", forgingWallet.getPublicKey());

            blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

            const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

            expect(voteBalanceAfter).toEqual(voteBalanceBefore.plus(voteWeight));
        });

        it("should not revert vote balances if wallet hasn't voted", () => {
            const voteBalanceBefore = Utils.BigNumber.ZERO;

            forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

            const voteWeight = Utils.BigNumber.make(5678);

            blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

            const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

            expect(voteBalanceAfter).toEqual(voteBalanceBefore);
        });

        it("should revert vote balances", () => {
            const voteBalanceBefore = Utils.BigNumber.make(6789);

            forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

            const voteWeight = Utils.BigNumber.make(5678);

            votingWallet.setBalance(voteWeight);

            votingWallet.setAttribute("vote", forgingWallet.getPublicKey());

            blockState.decreaseWalletDelegateVoteBalance(votingWallet, voteWeight);

            const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

            expect(voteBalanceAfter).toEqual(voteBalanceBefore.minus(voteWeight));
        });

        it("should update vote balances for negative votes", async () => {
            const voteAddress = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
            addTransactionsToBlock(makeVoteTransactions(3, [`-${voteAddress}`]), blocks[0]);

            const sendersBalance = Utils.BigNumber.make(1234);
            const testTransaction = blocks[0].transactions[0];

            const sender = walletRepo.findByPublicKey(testTransaction.data.senderPublicKey);
            sender.setBalance(sendersBalance);

            const votedForDelegate: Contracts.State.Wallet = walletRepo.findByPublicKey(voteAddress);
            const delegateBalanceBefore = Utils.BigNumber.make(4918);
            votedForDelegate.setAttribute("delegate.voteBalance", delegateBalanceBefore);

            await blockState.applyTransaction(testTransaction);

            const delegateBalanceAfterApply = votedForDelegate.getAttribute("delegate.voteBalance");
            expect(delegateBalanceAfterApply).toEqual(
                delegateBalanceBefore.minus(sendersBalance.plus(testTransaction.data.fee)),
            );

            await blockState.revertTransaction(testTransaction);

            expect(votedForDelegate.getAttribute("delegate.voteBalance")).toEqual(
                delegateBalanceAfterApply.plus(sendersBalance),
            );
        });
    });

    it("should create forger wallet if it doesn't exist genesis block", async () => {
        //@ts-ignore
        const spyApplyBlockToForger = jest.spyOn(blockState, "applyBlockToForger");
        // @ts-ignore
        spyApplyBlockToForger.mockImplementationOnce(() => {});
        const spyCreateWallet = jest.spyOn(walletRepo, "createWallet");
        blocks[0].data.height = 1;
        blocks[0].data.generatorPublicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        await expect(blockState.applyBlock(blocks[0])).toResolve();
        expect(spyInitGenesisForgerWallet).toHaveBeenCalledWith(blocks[0].data.generatorPublicKey);
        expect(spyCreateWallet).toHaveBeenCalled();
    });

    it("should apply the block data to the forger", async () => {
        const balanceBefore = forgingWallet.getBalance();

        const reward = Utils.BigNumber.make(50);
        const totalFee = Utils.BigNumber.make(50);
        blocks[0].data.reward = reward;
        blocks[0].data.totalFee = totalFee;
        const balanceIncrease = reward.plus(totalFee);

        await blockState.applyBlock(blocks[0]);

        expect(spyApplyBlockToForger).toHaveBeenCalledWith(forgingWallet, blocks[0].data);
        expect(spyApplyVoteBalances).toHaveBeenCalled();

        expect(spyIncreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(forgingWallet, balanceIncrease);

        const delegateAfter = forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        const productsBlocks = 1;

        expect(delegateAfter.producedBlocks).toEqual(productsBlocks);
        expect(delegateAfter.forgedFees).toEqual(totalFee);
        expect(delegateAfter.forgedRewards).toEqual(reward);
        expect(delegateAfter.lastBlock).toEqual(blocks[0].data);

        expect(forgingWallet.getBalance()).toEqual(balanceBefore.plus(balanceIncrease));
    });

    it("should revert the block data for the forger", async () => {
        const balanceBefore = forgingWallet.getBalance();

        const reward = Utils.BigNumber.make(52);
        const totalFee = Utils.BigNumber.make(49);
        blocks[0].data.reward = reward;
        blocks[0].data.totalFee = totalFee;
        const balanceIncrease = reward.plus(totalFee);

        await blockState.applyBlock(blocks[0]);

        expect(forgingWallet.getBalance()).toEqual(balanceBefore.plus(balanceIncrease));

        await blockState.revertBlock(blocks[0]);

        expect(spyApplyBlockToForger).toHaveBeenCalledWith(forgingWallet, blocks[0].data);
        expect(spyRevertBlockFromForger).toHaveBeenCalledWith(forgingWallet, blocks[0].data);
        expect(spyIncreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(forgingWallet, balanceIncrease);
        expect(spyDecreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(forgingWallet, balanceIncrease);

        const delegate = forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");

        expect(delegate.producedBlocks).toEqual(0);
        expect(delegate.forgedFees).toEqual(Utils.BigNumber.ZERO);
        expect(delegate.forgedRewards).toEqual(Utils.BigNumber.ZERO);
        expect(delegate.lastBlock).toEqual(undefined);

        expect(forgingWallet.getBalance()).toEqual(balanceBefore);
    });

    it("should update sender's and recipient's delegate's vote balance when applying transaction", async () => {
        const sendersDelegate = forgingWallet;
        sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

        const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

        const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
        sendingWallet.setBalance(amount);

        const recipientsDelegateBefore: Utils.BigNumber = recipientsDelegate.getAttribute("delegate.voteBalance");

        sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
        recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());

        walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);

        const transferTransaction = factory
            .get("Transfer")
            .withOptions({
                amount,
                senderPublicKey: sendingWallet.getPublicKey(),
                recipientId: recipientWallet.getAddress(),
            })
            .make();

        // @ts-ignore
        const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
        // @ts-ignore
        await blockState.applyTransaction(transferTransaction);

        expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(recipientsDelegateBefore.plus(amount));
        expect(sendersDelegate.getAttribute("delegate.voteBalance")).toEqual(senderDelegateBefore.minus(total));
    });

    it("should update sender's and recipient's delegate's vote balance when reverting transaction", async () => {
        const sendersDelegate = forgingWallet;
        sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

        const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

        const sendingWallet: Wallet = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase1",
                nonce: 0,
            })
            .make();

        const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
        sendingWallet.setBalance(amount);

        const recipientDelegateBefore = recipientsDelegate.getAttribute("delegate.voteBalance");

        sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
        recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());

        walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);

        const transferTransaction = factory
            .get("Transfer")
            .withOptions({
                amount,
                senderPublicKey: sendingWallet.getPublicKey(),
                recipientId: recipientWallet.getAddress(),
            })
            .make();

        // @ts-ignore
        const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
        // @ts-ignore
        await blockState.revertTransaction(transferTransaction);

        expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(recipientDelegateBefore.minus(amount));
        expect(sendersDelegate.getAttribute("delegate.voteBalance")).toEqual(senderDelegateBefore.plus(total));
    });

    describe("Multipayment", () => {
        let multiPaymentTransaction: Interfaces.ITransaction;
        let sendersDelegate: Contracts.State.Wallet;
        let amount: Utils.BigNumber;

        beforeEach(() => {
            sendersDelegate = forgingWallet;
            sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

            const sendingWallet: Wallet = factory
                .get("Wallet")
                .withOptions({
                    passphrase: "testPassphrase1",
                    nonce: 0,
                })
                .make();

            amount = Utils.BigNumber.make(2345);

            multiPaymentTransaction = factory
                .get("MultiPayment")
                .withOptions({
                    amount,
                    senderPublicKey: sendingWallet.getPublicKey(),
                    recipientId: recipientWallet.getAddress(),
                })
                .make();

            // @ts-ignore
            multiPaymentTransaction.data.asset.payments = [
                {
                    // @ts-ignore
                    amount: [amount],
                    recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
                },
                {
                    // @ts-ignore
                    amount: [amount],
                    recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
                },
            ];
            // TODO: Why do these need to be set manually here?
            // @ts-ignore
            multiPaymentTransaction.typeGroup = multiPaymentTransaction.data.typeGroup;
            // @ts-ignore
            multiPaymentTransaction.type = multiPaymentTransaction.data.type;

            sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
            recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());
            walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);
        });

        it("should fail if there are no assets", async () => {
            sendingWallet.forgetAttribute("vote");
            walletRepo.index([sendingWallet]);

            // @ts-ignore
            delete multiPaymentTransaction.data.asset;

            await expect(blockState.applyTransaction(multiPaymentTransaction)).toReject();
        });

        it("should fail if there are no assets and sending wallet has voted", async () => {
            // @ts-ignore
            delete multiPaymentTransaction.data.asset;

            await expect(blockState.applyTransaction(multiPaymentTransaction)).toReject();
        });

        it("should be okay when recipient hasn't voted", async () => {
            recipientWallet.forgetAttribute("vote");
            walletRepo.index([recipientWallet]);

            await expect(blockState.applyTransaction(multiPaymentTransaction)).toResolve();
        });

        it("should update delegates vote balance for multiPayments", async () => {
            const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");
            const recipientsDelegateBefore = recipientsDelegate.getAttribute("delegate.voteBalance");

            await blockState.applyTransaction(multiPaymentTransaction);

            expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(
                recipientsDelegateBefore.plus(amount).times(2),
            );
            expect(sendersDelegate.getAttribute("delegate.voteBalance")).toEqual(
                senderDelegateBefore.minus(amount.times(2).plus(multiPaymentTransaction.data.fee)),
            );

            await blockState.revertTransaction(multiPaymentTransaction);

            expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(sendersDelegate.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("apply and revert transactions", () => {
        const factory = new FactoryBuilder();

        Factories.registerTransactionFactory(factory);
        Factories.registerWalletFactory(factory);

        const sender: any = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase1",
                nonce: 0,
            })
            .make();

        const recipientWallet: any = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase2",
            })
            .make();

        const transfer = factory
            .get("Transfer")
            .withOptions({ amount: 96579, senderPublicKey: sender.publicKey, recipientId: recipientWallet.address })
            .make();

        const delegateReg = factory
            .get("DelegateRegistration")
            .withOptions({
                username: "dummy",
                senderPublicKey: sender.getPublicKey(),
                recipientId: recipientWallet.getAddress(),
            })
            .make()
            // @ts-ignore
            .sign("delegatePassphrase")
            .build();

        const secondSign = factory
            .get("Transfer")
            .withOptions({ amount: 10000000, senderPublicKey: sender.publicKey, recipientId: recipientWallet.address })
            .make();

        const vote = factory
            .get("Vote")
            .withOptions({
                publicKey: recipientWallet.publicKey,
                senderPublicKey: sender.publicKey,
                recipientId: recipientWallet.address,
            })
            .make();

        const delegateRes = factory
            .get("DelegateResignation")
            .withOptions({
                username: "dummy",
                senderPublicKey: sender.getPublicKey(),
                recipientId: recipientWallet.getAddress(),
            })
            .make()
            // @ts-ignore
            .sign("delegatePassphrase")
            .build();

        const ipfs = factory
            .get("Ipfs")
            .withOptions({ senderPublicKey: sender.getPublicKey(), recipientId: recipientWallet.getAddress() })
            .make();

        const htlcLock = factory
            .get("HtlcLock")
            .withOptions({ senderPublicKey: sender.getPublicKey(), recipientId: recipientWallet.getAddress() })
            .make();

        const htlcRefund = factory
            .get("HtlcRefund")
            .withOptions({
                secretHash: "secretHash",
                senderPublicKey: sender.publicKey,
                recipientId: recipientWallet.address,
            })
            .make();

        describe.each`
            type                      | transaction
            ${"transfer"}             | ${transfer}
            ${"delegateRegistration"} | ${delegateReg}
            ${"2nd sign"}             | ${secondSign}
            ${"vote"}                 | ${vote}
            ${"delegateResignation"}  | ${delegateRes}
            ${"ipfs"}                 | ${ipfs}
            ${"htlcLock"}             | ${htlcLock}
            ${"htlcRefund"}           | ${htlcRefund}
        `("when the transaction is a $type", ({ transaction }) => {
            it("should call the transaction handler apply the transaction to the sender & recipient", async () => {
                await blockState.applyTransaction(transaction);

                expect(applySpy).toHaveBeenCalledWith(transaction);
            });

            it("should call be able to revert the transaction", async () => {
                await blockState.revertTransaction(transaction);

                expect(revertSpy).toHaveBeenCalledWith(transaction);
            });

            it("not fail to apply transaction if the recipient doesn't exist", async () => {
                transaction.data.recipientId = "don'tExist";

                forgetWallet(recipientWallet);

                await expect(blockState.applyTransaction(transaction)).toResolve();
            });

            it("not fail to revert transaction if the recipient doesn't exist", async () => {
                transaction.data.recipientId = "don'tExist";

                forgetWallet(recipientWallet);

                await expect(blockState.revertTransaction(transaction)).toResolve();
            });
        });

        describe("vote", () => {
            it("should fail if there are no assets", async () => {
                const voteTransaction = factory
                    .get("Vote")
                    .withOptions({
                        publicKey: recipientWallet.publicKey,
                        senderPublicKey: sender.publicKey,
                        recipientId: recipientWallet.address,
                    })
                    .make();

                // @ts-ignore
                delete voteTransaction.data.asset;

                await expect(blockState.applyTransaction(voteTransaction as Interfaces.ITransaction)).toReject();
            });
        });

        describe("htlc transaction", () => {
            let htlcClaimTransaction: Interfaces.ITransaction;
            let htlcLock: Interfaces.ITransaction;
            let lockData;
            let lockID;

            beforeEach(() => {
                const amount = Utils.BigNumber.make(2345);

                htlcLock = factory
                    .get("HtlcLock")
                    .withOptions({ amount, senderPublicKey: sender.publicKey, recipientId: recipientWallet.address })
                    .make();

                htlcClaimTransaction = factory
                    .get("HtlcClaim")
                    .withOptions({
                        amount,
                        senderPublicKey: sender.publicKey,
                        recipientId: recipientWallet.address,
                    })
                    .make();

                // TODO: Why do these need to be set manually here?
                // @ts-ignore
                htlcClaimTransaction.typeGroup = htlcClaimTransaction.data.typeGroup;
                // @ts-ignore
                htlcClaimTransaction.type = htlcClaimTransaction.data.type;
                htlcClaimTransaction.data.recipientId = recipientWallet.address;

                sender.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

                lockData = {
                    amount: amount,
                    recipientId: recipientWallet.address,
                    ...htlcClaimTransaction.data.asset!.lock,
                };

                lockID = htlcClaimTransaction.data.asset.claim.lockTransactionId;

                sender.setAttribute("htlc.locks", {
                    [lockID]: lockData,
                });

                walletRepo.index(sender);
                walletRepo.index(recipientWallet);
            });

            it("apply should find correct locks, sender and recipient wallets", async () => {
                await blockState.applyTransaction(htlcClaimTransaction);
                expect(applySpy).toHaveBeenCalledWith(htlcClaimTransaction);
                expect(spyApplyVoteBalances).toHaveBeenCalledWith(
                    sender,
                    recipientWallet,
                    htlcClaimTransaction.data,
                    walletRepo.findByIndex(Contracts.State.WalletIndexes.Locks, lockID),
                    lockData,
                );
            });

            it("revert should find correct locks, sender and recipient wallets", async () => {
                await blockState.revertTransaction(htlcClaimTransaction);
                expect(revertSpy).toHaveBeenCalledWith(htlcClaimTransaction);
                expect(spyRevertVoteBalances).toHaveBeenCalledWith(
                    sender,
                    recipientWallet,
                    htlcClaimTransaction.data,
                    walletRepo.findByIndex(Contracts.State.WalletIndexes.Locks, lockID),
                    lockData,
                );
            });

            it("update vote balances for claims transactions", async () => {
                const recipientsDelegate = walletRepo.findByPublicKey(
                    "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
                );
                sender.setAttribute("vote", forgingWallet.getPublicKey());
                recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());

                await blockState.applyTransaction(htlcClaimTransaction);

                expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(
                    htlcClaimTransaction.data.amount,
                );
                expect(forgingWallet.getAttribute("delegate.voteBalance")).toEqual(htlcClaimTransaction.data.amount);

                await blockState.revertTransaction(htlcClaimTransaction);

                expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(forgingWallet.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
            });

            it("should update vote balances for lock transactions", async () => {
                sender.setAttribute("vote", forgingWallet.getPublicKey());
                const forgingWalletBefore = Utils.BigNumber.ZERO;
                forgingWallet.setAttribute("delegate.voteBalance", forgingWalletBefore);

                await blockState.applyTransaction(htlcLock);

                const delegateBalanceAfterApply = forgingWallet.getAttribute("delegate.voteBalance");

                expect(delegateBalanceAfterApply).toEqual(forgingWalletBefore.minus(htlcLock.data.fee));

                await blockState.revertTransaction(htlcLock);

                expect(forgingWallet.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
            });

            it("should fail to apply if there are no assets", async () => {
                // @ts-ignore
                delete htlcClaimTransaction.data.asset;
                await expect(blockState.applyTransaction(htlcClaimTransaction)).toReject();
            });

            it("should fail to reject if there are no assets", async () => {
                await blockState.applyTransaction(htlcClaimTransaction);
                // @ts-ignore
                delete htlcClaimTransaction.data.asset;

                await expect(blockState.revertTransaction(htlcClaimTransaction)).toReject();
            });

            it("should update recipient vote balance if it isn't a core typeground", async () => {
                htlcLock.data.recipientId = recipientWallet.address;
                htlcLock.data.type = Enums.TransactionType.HtlcLock;
                htlcLock.data.typeGroup = Enums.TransactionTypeGroup.Test;

                const recipientsDelegateBalanceBefore = recipientsDelegate.getAttribute("delegate.voteBalance");

                await blockState.applyTransaction(htlcLock);

                expect(recipientsDelegate.getAttribute("delegate.voteBalance")).toEqual(
                    recipientsDelegateBalanceBefore.plus(htlcLock.data.amount),
                );
            });
        });
    });

    describe("when 1 transaction fails while reverting it", () => {
        it("should apply sequentially (from first to last) all the reverted transactions of the block", async () => {
            // @ts-ignore
            spyRevertTransaction.mockImplementation((tx) => {
                if (tx === blocks[0].transactions[0]) {
                    throw new Error("Fake error");
                }
            });

            expect(blocks[0].transactions.length).toBe(3);
            await expect(blockState.revertBlock(blocks[0])).rejects.toEqual(Error("Fake error"));

            expect(spyApplyTransaction).toHaveBeenCalledTimes(2);
            expect(applySpy).toHaveBeenCalledTimes(2);

            let counter = 1;
            for (const transaction of blocks[0].transactions.slice(1)) {
                expect(spyApplyTransaction).toHaveBeenNthCalledWith(counter++, transaction);
            }
        });

        it("throws the Error", async () => {
            spyRevertTransaction.mockImplementationOnce(() => {
                throw new Error("Fake error");
            });
            await expect(blockState.revertBlock(blocks[0])).rejects.toEqual(Error("Fake error"));
        });
    });

    describe("when 1 transaction fails while applying it", () => {
        it("should revert sequentially (from last to first) all the transactions of the block", async () => {
            // @ts-ignore
            spyApplyTransaction.mockImplementation((tx) => {
                if (tx === blocks[0].transactions[2]) {
                    throw new Error("Fake error");
                }
            });

            expect(blocks[0].transactions.length).toBe(3);
            await expect(blockState.applyBlock(blocks[0])).rejects.toEqual(Error("Fake error"));

            expect(spyRevertTransaction).toHaveBeenCalledTimes(2);
            expect(revertSpy).toHaveBeenCalledTimes(2);

            for (const transaction of blocks[0].transactions.slice(0, 1)) {
                const i = blocks[0].transactions.slice(0, 1).indexOf(transaction);
                const total = blocks[0].transactions.slice(0, 1).length;
                expect(spyRevertTransaction).toHaveBeenNthCalledWith(total + 1 - i, blocks[0].transactions[i]);
            }
        });

        it("throws the Error", async () => {
            spyApplyTransaction.mockImplementationOnce(() => {
                throw new Error("Fake error");
            });
            await expect(blockState.applyBlock(blocks[0])).rejects.toEqual(Error("Fake error"));
        });
    });
});
