import "jest-extended";

import { ITransaction } from "@packages/crypto/dist/interfaces";
import { Contracts } from "@packages/core-kernel/src";
import { BlockState } from "@packages/core-state/src/block-state";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Utils } from "@packages/crypto/src";
import { IBlock } from "@packages/crypto/src/interfaces";

import { addTransactionsToBlock } from "./__utils__/transactions";
import { makeChainedBlocks, makeVoteTransactions } from "./helper";
import { setUp, setUpDefaults } from "./setup";

let blockState: BlockState;
let factory: FactoryBuilder;
let blocks: IBlock[];
let walletRepo: WalletRepository;
let applySpy: jest.SpyInstance;
let revertSpy: jest.SpyInstance;
let spyApplyTransaction: jest.SpyInstance;
let spyRevertTransaction: jest.SpyInstance;
let spyIncreaseWalletDelegateVoteBalance: jest.SpyInstance;
let spyInitGenesisGeneratorWallet: jest.SpyInstance;
let spyApplyBlockToGenerator: jest.SpyInstance;
let spyDecreaseWalletDelegateVoteBalance: jest.SpyInstance;
let spyApplyVoteBalances: jest.SpyInstance;
let spyRevertVoteBalances: jest.SpyInstance;
let spyRevertBlockFromGenerator: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = await setUp(setUpDefaults, true); // todo: why do I have to skip booting?
    walletRepo = initialEnv.walletRepo;
    blockState = initialEnv.blockState;
    factory = initialEnv.factory;
    applySpy = initialEnv.spies.applySpy;
    revertSpy = initialEnv.spies.revertSpy;
});

beforeAll(() => {
    blocks = makeChainedBlocks(101, factory.get("Block"));

    spyApplyTransaction = jest.spyOn(blockState, "applyTransaction");
    spyRevertTransaction = jest.spyOn(blockState, "revertTransaction");
    spyIncreaseWalletDelegateVoteBalance = jest.spyOn(blockState, "increaseWalletDelegateVoteBalance");
    spyDecreaseWalletDelegateVoteBalance = jest.spyOn(blockState, "decreaseWalletDelegateVoteBalance");
    spyInitGenesisGeneratorWallet = jest.spyOn(blockState as any, "initGenesisGeneratorWallet");
    spyApplyBlockToGenerator = jest.spyOn(blockState as any, "applyBlockToGenerator");
    spyApplyVoteBalances = jest.spyOn(blockState as any, "applyVoteBalances");
    spyRevertVoteBalances = jest.spyOn(blockState as any, "revertVoteBalances");
    spyRevertBlockFromGenerator = jest.spyOn(blockState as any, "revertBlockFromGenerator");

    walletRepo.reset();
});

afterEach(() => jest.clearAllMocks());

describe("BlockState", () => {
    let generatorWallet: Contracts.State.Wallet;

    beforeEach(() => {
        generatorWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

        generatorWallet.setAttribute("delegate", {
            username: "test",
            forgedFees: Utils.BigNumber.ZERO,
            forgedRewards: Utils.BigNumber.ZERO,
            producedBlocks: 0,
            lastBlock: undefined,
        });

        walletRepo.index(generatorWallet);

        addTransactionsToBlock(
            makeVoteTransactions(3, [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]),
            blocks[0],
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should apply sequentially the transactions of the block", async () => {
        await blockState.applyBlock(blocks[0]);

        for (let i = 0; i < blocks[0].transactions.length; i++) {
            expect(spyApplyTransaction).toHaveBeenNthCalledWith(i + 1, blocks[0].transactions[i]);
        }
    });

    it("should call the handler for each transaction", async () => {
        await blockState.applyBlock(blocks[0]);

        expect(applySpy).toHaveBeenCalledTimes(blocks[0].transactions.length);
        expect(revertSpy).not.toHaveBeenCalled();
    });

    it("should init generator wallet on genesis block", async () => {
        blocks[0].data.height = 1;
        await blockState.applyBlock(blocks[0]);
        expect(spyInitGenesisGeneratorWallet).toHaveBeenCalledWith(blocks[0].data.generatorPublicKey);
    });

    it("should create generator wallet if it doesn't exist genesis block", async () => {
        //@ts-ignore
        const spyApplyBlockToGenerator = jest.spyOn(blockState, "applyBlockToGenerator");
        spyApplyBlockToGenerator.mockImplementationOnce(() => {});
        const spyCreateWallet = jest.spyOn(walletRepo, "createWallet");
        blocks[0].data.height = 1;
        blocks[0].data.generatorPublicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        await expect(blockState.applyBlock(blocks[0])).toResolve();
        expect(spyInitGenesisGeneratorWallet).toHaveBeenCalledWith(blocks[0].data.generatorPublicKey);
        expect(spyCreateWallet).toHaveBeenCalled();
    });

    it("should apply the block data to the delegate", async () => {
        const delegateBefore = generatorWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        const balanceBefore = generatorWallet.balance;

        await blockState.applyBlock(blocks[0]);

        expect(spyApplyBlockToGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect(spyApplyVoteBalances).toHaveBeenCalled();

        expect(spyIncreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);

        const balanceIncrease = blocks[0].data.transactions.reduce(
            (acc, currentTransaction) => acc.plus(currentTransaction.amount),
            Utils.BigNumber.ZERO,
        );
        const delegateAfter = generatorWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        const productsBlocks = 1;
        const forgedFees = delegateBefore.forgedFees.plus(blocks[0].data.totalFee);
        const forgedRewards = delegateBefore.forgedRewards.plus(blocks[0].data.reward);

        expect(delegateAfter.producedBlocks).toEqual(productsBlocks);
        expect(delegateAfter.forgedFees).toEqual(forgedFees);
        expect(delegateAfter.forgedRewards).toEqual(forgedRewards);
        expect(delegateAfter.lastBlock).toEqual(blocks[0].data);

        // TODO: use transactions that affect the balance
        expect(generatorWallet.balance).toEqual(balanceBefore.plus(balanceIncrease));
    });

    it("should revert the block data for the delegate", async () => {
        const balanceBefore = generatorWallet.balance;

        await blockState.applyBlock(blocks[0]);
        await blockState.revertBlock(blocks[0]);

        expect(spyApplyBlockToGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect(spyRevertBlockFromGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect(spyIncreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);
        expect(spyDecreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);

        const delegate = generatorWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");

        expect(delegate.producedBlocks).toEqual(0);
        expect(delegate.forgedFees).toEqual(Utils.BigNumber.ZERO);
        expect(delegate.forgedRewards).toEqual(Utils.BigNumber.ZERO);
        expect(delegate.lastBlock).toEqual(undefined);

        // TODO: use transactions that affect the balance
        expect(generatorWallet.balance).toEqual(balanceBefore);
    });

    it("should throw if there is no generator wallet", () => {
        walletRepo.forgetByPublicKey(generatorWallet.publicKey);
        expect(async () => await blockState.applyBlock(blocks[0])).toReject();
    });

    describe("applyTransaction", () => {
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

        const recipient: any = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase2",
            })
            .make();

        const transfer = factory
            .get("Transfer")
            .withOptions({ amount: 96579, senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make();

        const delegateReg = factory
            .get("DelegateRegistration")
            .withOptions({ username: "dummy", senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make()
            // @ts-ignore
            .sign("delegatePassphrase")
            .build();

        const secondSign = factory
            .get("Transfer")
            .withOptions({ amount: 10000000, senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make();

        const vote = factory
            .get("Vote")
            .withOptions({
                publicKey: recipient.publicKey,
                senderPublicKey: sender.publicKey,
                recipientId: recipient.address,
            })
            .make();

        const delegateRes = factory
            .get("DelegateResignation")
            .withOptions({ username: "dummy", senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make()
            // @ts-ignore
            .sign("delegatePassphrase")
            .build();

        const ipfs = factory
            .get("Ipfs")
            .withOptions({ senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make();

        const htlcLock = factory
            .get("HtlcLock")
            .withOptions({ senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make();

        const htlcRefund = factory
            .get("HtlcRefund")
            .withOptions({
                secretHash: "secretHash",
                senderPublicKey: sender.publicKey,
                recipientId: recipient.address,
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
        });

        describe("htlc lock transaction", () => {
            let htlcClaimTransaction: ITransaction;
            let lockData;
            let lockID;

            beforeEach(() => {
                htlcClaimTransaction = factory
                    .get("HtlcClaim")
                    .withOptions({ senderPublicKey: sender.publicKey, recipientId: recipient.address })
                    .make();

                // TODO: Why do these need to be set manually here?
                // @ts-ignore
                htlcClaimTransaction.typeGroup = htlcClaimTransaction.data.typeGroup;
                // @ts-ignore
                htlcClaimTransaction.type = htlcClaimTransaction.data.type;
                htlcClaimTransaction.data.recipientId = recipient.address;

                sender.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(htlcClaimTransaction.data.amount));

                lockData = {
                    amount: htlcClaimTransaction.data.amount,
                    recipientId: recipient.address,
                    ...htlcClaimTransaction.data.asset!.lock,
                };

                lockID = htlcClaimTransaction.data.asset.claim.lockTransactionId;

                sender.setAttribute("htlc.locks", {
                    [lockID]: lockData,
                });

                walletRepo.index(sender);
                walletRepo.index(recipient);
            });

            it("apply should find correct locks, sender and recipient wallets", async () => {
                await blockState.applyTransaction(htlcClaimTransaction);
                expect(applySpy).toHaveBeenCalledWith(htlcClaimTransaction);
                expect(spyApplyVoteBalances).toHaveBeenCalledWith(
                    sender,
                    recipient,
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
                    recipient,
                    htlcClaimTransaction.data,
                    walletRepo.findByIndex(Contracts.State.WalletIndexes.Locks, lockID),
                    lockData,
                );
            });
        });
    });

    describe("when 1 transaction fails while applying it", () => {
        it("should revert sequentially (from last to first) all the transactions of the block", async () => {
            // @ts-ignore
            spyApplyTransaction.mockImplementation(tx => {
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
