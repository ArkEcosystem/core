import "jest-extended";

import { Contracts } from "@packages/core-kernel/src";
import { BlockState } from "@packages/core-state/src/block-state";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Utils } from "@packages/crypto/src";
import { IBlock, ITransaction } from "@packages/crypto/src/interfaces";

import { makeChainedBlocks, makeVoteTransactions } from "./helper";
import { setUp } from "./setup";

let blockState: BlockState;
let factory: FactoryBuilder;
let blocks: IBlock[];
let walletRepo: WalletRepository;
let applySpy: jest.SpyInstance;
let revertSpy: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = await setUp();
    walletRepo = initialEnv.walletRepo;
    blockState = initialEnv.blockState;
    factory = initialEnv.factory;
    applySpy = initialEnv.spies.applySpy;
    revertSpy = initialEnv.spies.revertSpy;
});

export const addTransactionsToBlock = (txs: ITransaction[], block: IBlock) => {
    const { data } = block;
    data.transactions = [];
    txs.forEach(tx => data.transactions.push(tx.data));
    data.transactions.push(txs[0].data);
    data.transactions.push(txs[1].data);
    data.transactions.push(txs[2].data);
    data.numberOfTransactions = txs.length; // NOTE: if transactions are added to a fixture the NoT needs to be increased
    block.transactions = txs;
};

beforeAll(() => {
    blocks = makeChainedBlocks(101, factory.get("Block"));

    jest.spyOn(blockState, "applyTransaction");
    jest.spyOn(blockState, "revertTransaction");
    jest.spyOn(blockState, "increaseWalletDelegateVoteBalance");
    jest.spyOn(blockState, "decreaseWalletDelegateVoteBalance");
    jest.spyOn(blockState as any, "initGenesisGeneratorWallet");
    jest.spyOn(blockState as any, "applyBlockToGenerator");
    jest.spyOn(blockState as any, "applyVoteBalances");
    jest.spyOn(blockState as any, "revertBlockFromGenerator");

    walletRepo.reset();
});

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
            expect(blockState.applyTransaction).toHaveBeenNthCalledWith(i + 1, blocks[0].transactions[i]);
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
        expect((blockState as any).initGenesisGeneratorWallet).toHaveBeenCalledWith(blocks[0].data.generatorPublicKey);
    });

    it("should apply the block data to the delegate", async () => {
        const delegateBefore = generatorWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
        const balanceBefore = generatorWallet.balance;

        await blockState.applyBlock(blocks[0]);

        expect((blockState as any).applyBlockToGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect((blockState as any).increaseWalletDelegateVoteBalance).toHaveBeenCalledWith(
            generatorWallet,
            Utils.BigNumber.ZERO,
        );

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

        expect((blockState as any).applyBlockToGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect((blockState as any).revertBlockFromGenerator).toHaveBeenCalledWith(generatorWallet, blocks[0].data);
        expect((blockState as any).increaseWalletDelegateVoteBalance).toHaveBeenCalledWith(
            generatorWallet,
            Utils.BigNumber.ZERO,
        );
        expect((blockState as any).decreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(
            generatorWallet,
            Utils.BigNumber.ZERO,
        );

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
    });

    describe("when 1 transaction fails while applying it", () => {
        it("should revert sequentially (from last to first) all the transactions of the block", async () => {
            // @ts-ignore
            jest.spyOn(blockState, "applyTransaction").mockImplementation(tx => {
                if (tx === blocks[0].transactions[2]) {
                    throw new Error("Fake error");
                }
            });

            expect(blocks[0].transactions.length).toBe(3);

            try {
                await blockState.applyBlock(blocks[0]);
                expect(undefined).toBe("this should fail if no error is thrown");
            } catch (error) {
                expect(blockState.revertTransaction).toHaveBeenCalledTimes(2);
                expect(revertSpy).toHaveBeenCalledTimes(2);

                for (const transaction of blocks[0].transactions.slice(0, 1)) {
                    const i = blocks[0].transactions.slice(0, 1).indexOf(transaction);
                    const total = blocks[0].transactions.slice(0, 1).length;
                    expect(blockState.revertTransaction).toHaveBeenNthCalledWith(
                        total + 1 - i,
                        blocks[0].transactions[i],
                    );
                }
            }
        });

        it("throws the Error", async () => {
            jest.spyOn(blockState, "applyTransaction").mockImplementation(() => {
                throw new Error("Fake error");
            });

            try {
                await blockState.applyBlock(blocks[0]);

                expect(undefined).toBe("this should fail if no error is thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Fake error");
            }
        });
    });
});
