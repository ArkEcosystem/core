import "jest-extended";

import { Application, Contracts, Enums as AppEnums, Exceptions } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import {
    AlreadyVotedError,
    InsufficientBalanceError,
    NoVoteError,
    UnvoteMismatchError,
    VotedForNonDelegateError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { configManager } from "@packages/crypto/src/managers";

import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
    streamByCriteria: jest.fn(),
};

beforeEach(() => {
    transactionHistoryService.streamByCriteria.mockReset();

    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder);
    multiSignatureWallet = buildMultiSignatureWallet();
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(multiSignatureWallet);
    walletRepository.index(recipientWallet);
});

describe("VoteTransaction", () => {
    let voteTransaction: Interfaces.ITransaction;
    let secondSignatureVoteTransaction: Interfaces.ITransaction;
    let multiSignatureVoteTransaction: Interfaces.ITransaction;
    let unvoteTransaction: Interfaces.ITransaction;
    let secondSignatureUnvoteTransaction: Interfaces.ITransaction;
    let multiSignatureUnvoteTransaction: Interfaces.ITransaction;
    let voteUnvoteTransaction: Interfaces.ITransaction;
    let unvoteVoteTransaction: Interfaces.ITransaction;
    let voteVoteTransaction: Interfaces.ITransaction;
    let unvoteUnvoteTransaction: Interfaces.ITransaction;
    let delegateWallet1: Wallets.Wallet;
    let delegateWallet2: Wallets.Wallet;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core),
            2,
        );

        delegateWallet1 = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: passphrases[8],
                nonce: 0,
            })
            .make();
        delegateWallet1.setAttribute("delegate", { username: "test1" });
        walletRepository.index(delegateWallet1);

        delegateWallet2 = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: passphrases[9],
                nonce: 0,
            })
            .make();
        delegateWallet2.setAttribute("delegate", { username: "test2" });
        walletRepository.index(delegateWallet2);

        voteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureVoteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureVoteTransaction = BuilderFactory.vote()
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .votesAsset(["+" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();

        unvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureUnvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureUnvoteTransaction = BuilderFactory.vote()
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .votesAsset(["-" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();

        voteUnvoteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet1.getPublicKey()!, "-" + delegateWallet1.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        unvoteVoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet1.getPublicKey()!, "+" + delegateWallet2.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        voteVoteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet1.getPublicKey()!, "+" + delegateWallet2.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        unvoteUnvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet1.getPublicKey()!, "-" + delegateWallet2.getPublicKey()!])
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield voteTransaction.data;
                yield unvoteTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Vote,
            });
        });

        it("should throw on vote if wallet already voted", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield voteTransaction.data;
            });
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(handler.bootstrap()).rejects.toThrow(AlreadyVotedError);
        });

        it("should throw on unvote if wallet did not vote", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield unvoteTransaction.data;
            });
            await expect(handler.bootstrap()).rejects.toThrow(NoVoteError);
        });

        it("should throw on unvote if wallet vote is mismatch", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield unvoteTransaction.data;
            });
            senderWallet.setAttribute("vote", "no_a_public_key");
            await expect(handler.bootstrap()).rejects.toThrow(UnvoteMismatchError);
        });

        it("should throw if asset is undefined", async () => {
            unvoteTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield unvoteTransaction.data;
            });
            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(voteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(AppEnums.VoteEvent.Vote, expect.anything());
            expect(spy).not.toHaveBeenCalledWith(AppEnums.VoteEvent.Unvote, expect.anything());

            spy.mockClear();
            handler.emitEvents(unvoteTransaction, emitter);

            expect(spy).not.toHaveBeenCalledWith(AppEnums.VoteEvent.Vote, expect.anything());
            expect(spy).toHaveBeenCalledWith(AppEnums.VoteEvent.Unvote, expect.anything());

            spy.mockClear();
            handler.emitEvents(voteUnvoteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(AppEnums.VoteEvent.Vote, expect.anything());
            expect(spy).toHaveBeenCalledWith(AppEnums.VoteEvent.Unvote, expect.anything());
        });

        it("should throw if asset.votes is undefined", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            voteTransaction.data.asset!.votes = undefined;

            expect(() => {
                handler.emitEvents(voteTransaction, emitter);
            }).toThrow(Exceptions.Runtime.AssertionException);
        });

        it("should throw if asset is undefined", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            voteTransaction.data.asset = undefined;

            expect(() => {
                handler.emitEvents(voteTransaction, emitter);
            }).toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw if the vote is valid and the wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).toResolve();
        });

        it("should not throw - second sign vote", async () => {
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureVoteTransaction, secondSignatureWallet),
            ).toResolve();
        });

        it("should not throw - multi sign vote", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureVoteTransaction, multiSignatureWallet),
            ).toResolve();
        });

        it("should not throw if the unvote is valid and the wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet)).toResolve();
        });

        it("should not throw - second sign unvote", async () => {
            secondSignatureWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureUnvoteTransaction, secondSignatureWallet),
            ).toResolve();
        });

        it("should not throw - multi sign unvote", async () => {
            multiSignatureWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureUnvoteTransaction, multiSignatureWallet),
            ).toResolve();
        });

        it("should throw if wallet has already voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw if vote for non delegate wallet", async () => {
            delegateWallet1.forgetAttribute("delegate");
            walletRepository.index(delegateWallet1);
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
                VotedForNonDelegateError,
            );
        });

        it("should throw if the asset public key differs from the currently voted one", async () => {
            senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet)).rejects.toThrow(
                UnvoteMismatchError,
            );
        });

        it("should throw if unvoting a non-voted wallet", async () => {
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet)).rejects.toThrow(NoVoteError);
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet has insufficient funds for unvote", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if asset.votes is undefined", async () => {
            voteTransaction.data.asset!.votes = undefined;

            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            voteTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should not throw on vote+unvote transaction when wallet has not voted", async () => {
            await handler.throwIfCannotBeApplied(voteUnvoteTransaction, senderWallet);
        });

        it("should throw on vote+unvote transaction when wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

            await expect(handler.throwIfCannotBeApplied(voteUnvoteTransaction, senderWallet)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should not throw on unvote+vote transaction when wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

            await handler.throwIfCannotBeApplied(unvoteVoteTransaction, senderWallet);
        });

        it("should throw on unvote+vote transaction when wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(unvoteVoteTransaction, senderWallet)).rejects.toThrow(
                NoVoteError,
            );
        });

        it("should throw on vote+vote transaction when wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(voteVoteTransaction, senderWallet)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw on unvote+unvote transaction when wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

            await expect(handler.throwIfCannotBeApplied(unvoteUnvoteTransaction, senderWallet)).rejects.toThrow(
                NoVoteError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(voteTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(voteTransaction);

            await expect(handler.throwIfCannotEnterPool(voteTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", async () => {
                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.apply(voteTransaction);
                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });

            it("should not be ok", async () => {
                senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await expect(handler.apply(voteTransaction)).rejects.toThrow(AlreadyVotedError);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.apply(unvoteTransaction);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });

        describe("vote+unvote", () => {
            it("should apply when wallet has not voted", async () => {
                await handler.apply(voteUnvoteTransaction);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });

            it("should throw when wallet has voted", async () => {
                senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

                await expect(handler.apply(voteUnvoteTransaction)).rejects.toThrow(AlreadyVotedError);
            });
        });

        describe("unvote+vote", () => {
            it("should apply when wallet has voted", async () => {
                senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());

                await handler.apply(unvoteVoteTransaction);

                expect(senderWallet.getAttribute("vote")).toEqual(delegateWallet2.getPublicKey());
            });

            it("should throw when wallet has not voted", async () => {
                await expect(handler.apply(unvoteUnvoteTransaction)).rejects.toThrow(NoVoteError);
            });

            it("should throw when wallet has voted for different delegate", async () => {
                senderWallet.setAttribute("vote", delegateWallet2.getPublicKey());

                await expect(handler.apply(unvoteUnvoteTransaction)).rejects.toThrow(UnvoteMismatchError);
            });
        });
    });

    describe("applyForSender", () => {
        it("should throw if asset.vote is undefined", async () => {
            voteTransaction.data.asset!.votes = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(voteTransaction)).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });

        it("should throw if asset is undefined", async () => {
            voteTransaction.data.asset = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(voteTransaction)).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet1.getPublicKey());
                senderWallet.setNonce(Utils.BigNumber.make(1));

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.revert(voteTransaction);

                expect(senderWallet.getNonce().isZero()).toBeTrue();
                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", async () => {
                senderWallet.setNonce(Utils.BigNumber.make(1));

                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.revert(unvoteTransaction);

                expect(senderWallet.getNonce().isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBe(delegateWallet1.getPublicKey());
            });
        });

        describe("vote+unvote", () => {
            it("should revert when wallet has no vote", async () => {
                senderWallet.setNonce(Utils.BigNumber.make(1));

                await handler.revert(voteUnvoteTransaction);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });

        describe("unvote+vote", () => {
            it("should revert when wallet has no vote", async () => {
                senderWallet.setAttribute("vote", delegateWallet2.getPublicKey());
                senderWallet.setNonce(Utils.BigNumber.make(1));

                await handler.revert(unvoteVoteTransaction);

                expect(senderWallet.getAttribute("vote")).toEqual(delegateWallet1.getPublicKey());
            });
        });
    });

    describe("revertForSender", () => {
        it("should throw if asset.vote is undefined", async () => {
            voteTransaction.data.asset!.votes = undefined;

            senderWallet.setNonce(Utils.BigNumber.ONE);

            await expect(handler.revertForSender(voteTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            voteTransaction.data.asset = undefined;

            senderWallet.setNonce(Utils.BigNumber.ONE);

            await expect(handler.revertForSender(voteTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });
});
