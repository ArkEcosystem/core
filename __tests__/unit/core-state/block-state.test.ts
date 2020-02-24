import "jest-extended";
import { Contracts } from "@arkecosystem/core-kernel";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

import { Utils, Transactions } from "@arkecosystem/crypto";
import { BlockState } from "../../../packages/core-state/src/block-state";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { IBlock, ITransaction } from "@arkecosystem/crypto/dist/interfaces";
import { DelegateResignationBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/delegate-resignation";
import { VoteBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/vote";
import { SecondSignatureBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/second-signature";
import { DelegateRegistrationBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/delegate-registration";
import { TransferBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/transfer";
import { IPFSBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/ipfs";
import { HtlcLockBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/htlc-lock";
import { HtlcRefundBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/htlc-refund";
import { setUp } from "./setup";

let blockState: BlockState;
let factory: FactoryBuilder;
let blocks: IBlock[];
let walletRepo: WalletRepository;
let applySpy: jest.SpyInstance;
let revertSpy: jest.SpyInstance;

beforeAll(() => {
    const initialEnv = setUp();
    walletRepo = initialEnv.walletRepo;
    blockState = initialEnv.blockState;
    factory = initialEnv.factory;
    applySpy = initialEnv.spies.applySpy;
    revertSpy = initialEnv.spies.revertSpy;

    jest.spyOn(blockState, "applyTransaction");
    jest.spyOn(blockState, "revertTransaction");
    jest.spyOn(blockState, "increaseWalletDelegateVoteBalance");
    jest.spyOn(blockState, "decreaseWalletDelegateVoteBalance");
    jest.spyOn((blockState as any), "initGenesisGeneratorWallet");
    jest.spyOn((blockState as any), "applyBlockToGenerator");
    jest.spyOn((blockState as any), "applyVoteBalances");
    jest.spyOn((blockState as any), "revertBlockFromGenerator");
});

beforeEach(() => {
    // TODO: is is better to use core-test-framework Transaction builder instead?
    const txs: ITransaction[] = [];
    for (let i = 0; i < 3; i++) {
        txs[i] = Transactions.BuilderFactory.vote()
            .sign(Math.random().toString(36))
            .votesAsset([`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`])
            .build();
    }

    // TODO: pull this out into helper
    const makeChainedBlocks = (length: number, blockFactory): IBlock[] => {
        const entitites: IBlock[] = [];
        let previousBlock; // first case uses genesis IBlockData
        const getPreviousBlock = () => previousBlock;

        for (let i = 0; i < length; i++) {
            if (previousBlock) {
                blockFactory.withOptions({getPreviousBlock}); // TODO: could add transactions in here, instead of setting them on the block object below (in tests)
            }
            const entity: IBlock = blockFactory.make();
            entitites.push(entity);
            previousBlock = entity.data;
        }
        return entitites;
    }
    blocks = makeChainedBlocks(101, factory.get("Block"));

    walletRepo.reset();

    jest.clearAllMocks();
    applySpy.mockClear();
    revertSpy.mockClear();
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

        walletRepo.reindex(generatorWallet);

        const txs: ITransaction[] = [];
        for (let i = 0; i < 3; i++) {
            txs[i] = Transactions.BuilderFactory.vote()
                .sign(Math.random().toString(36))
                .votesAsset([`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`])
                .build();
        }

        const { data } = blocks[0];
        data.transactions = [];
        data.transactions.push(txs[0].data);
        data.transactions.push(txs[1].data);
        data.transactions.push(txs[2].data);
        data.numberOfTransactions = 3; // NOTE: if transactions are added to a fixture the NoT needs to be increased
        blocks[0].transactions = txs;;
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

        expect((blockState as any).applyBlockToGenerator).toHaveBeenCalledWith( generatorWallet, blocks[0].data);
        expect((blockState as any).increaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);

        const balanceIncrease = blocks[0].data.transactions.reduce((acc, currentTransaction) => acc.plus(currentTransaction.amount), Utils.BigNumber.ZERO);
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

        expect((blockState as any).applyBlockToGenerator).toHaveBeenCalledWith( generatorWallet, blocks[0].data);
        expect((blockState as any).revertBlockFromGenerator).toHaveBeenCalledWith( generatorWallet, blocks[0].data);
        expect((blockState as any).increaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);
        expect((blockState as any).decreaseWalletDelegateVoteBalance).toHaveBeenCalledWith(generatorWallet, Utils.BigNumber.ZERO);

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
            blockState.applyTransaction = jest.fn(tx => {
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

    describe.only("applyTransaction", () => {

        let sender: Contracts.State.Wallet;
        let recipient: Contracts.State.Wallet;

        const factory = new FactoryBuilder();

        Factories.registerTransactionFactory(factory);
        Factories.registerWalletFactory(factory);

        sender = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase1",
                nonce: 0
            })
            .make();

        recipient  = factory
            .get("Wallet")
            .withOptions({
                passphrase: "testPassphrase2",
            })
            .make();

        const transfer = (<TransferBuilder>factory
            .get("Transfer")
            .withOptions({ amount: 96579, senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());

        const delegateReg = (<DelegateRegistrationBuilder>factory
            .get("DelegateRegistration")
            .withOptions({ username: "dummy", senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make())
            .sign("delegatePassphrase")
            .build();
    
        const secondSign = (<SecondSignatureBuilder>factory
            .get("Transfer")
            .withOptions({ amount: 10000000, senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());

        const vote = (<VoteBuilder>factory
            .get("Vote")
            .withOptions({ publicKey: recipient.publicKey, senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());
        
        const delegateRes = (<DelegateResignationBuilder>factory
            .get("DelegateResignation")
            .withOptions({ username: "dummy", senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make())
            .sign("delegatePassphrase")
            .build();
        
        const ipfs = (<IPFSBuilder>factory
            .get("Ipfs")
            .withOptions({ senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());
        
        const htlcLock = (<HtlcLockBuilder>factory
            .get("HtlcLock")
            .withOptions({ senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());

        const htlcRefund = (<HtlcRefundBuilder>factory
            .get("HtlcRefund")
            .withOptions({ secretHash: "secretHash", senderPublicKey: sender.publicKey, recipientId: recipient.address })
            .make());

        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe.each`
            type                        | transaction
            ${"transfer"}               | ${transfer}
            ${"delegateRegistration"}   | ${delegateReg}
            ${"2nd sign"}               | ${secondSign}
            ${"vote"}                   | ${vote}
            ${"delegateResignation"}    | ${delegateRes}
            ${"ipfs"}                   | ${ipfs}
            ${"htlcLock"}               | ${htlcLock}
            ${"htlcRefund"}              | ${htlcRefund}
        `("when the transaction is a $type", ({ transaction }) => {

            it("should call the transaction handler apply the transaction to the sender & recipient", async () => {
                await blockState.applyTransaction(transaction);

                expect(applySpy).toHaveBeenCalledWith(transaction);
            });
        });
    });
});