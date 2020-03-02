import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    AlreadyVotedError,
    InsufficientBalanceError,
    NoVoteError,
    UnvoteMismatchError, VotedForNonDelegateError,
} from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { Memory } from "@arkecosystem/core-transaction-pool/src/memory";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    setMockTransaction(null);

    app = initApp();

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
    let delegateWallet: Wallets.Wallet;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core), 2);

        delegateWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: passphrases[8],
                nonce: 0
            })
            .make();

        delegateWallet.setAttribute("delegate", { username: "test" });

        walletRepository.index(delegateWallet);

        voteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet.publicKey!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureVoteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet.publicKey!])
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureVoteTransaction = BuilderFactory.vote()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .votesAsset(["+" + delegateWallet.publicKey!])
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();

        unvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet.publicKey!])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureUnvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet.publicKey!])
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureUnvoteTransaction = BuilderFactory.vote()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .votesAsset(["-" + delegateWallet.publicKey!])
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            setMockTransaction(voteTransaction);
            await expect(handler.bootstrap()).toResolve();

            setMockTransaction(unvoteTransaction);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should throw on vote if wallet already voted", async () => {
            setMockTransaction(voteTransaction);
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.bootstrap()).rejects.toThrow(AlreadyVotedError);
        });

        it("should throw on unvote if wallet did not vote", async () => {
            setMockTransaction(unvoteTransaction);
            await expect(handler.bootstrap()).rejects.toThrow(NoVoteError);
        });

        it("should throw on unvote if wallet vote is mismatch", async () => {
            setMockTransaction(unvoteTransaction);
            senderWallet.setAttribute("vote", "no_a_public_key");
            await expect(handler.bootstrap()).rejects.toThrow(UnvoteMismatchError);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(voteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith("wallet.vote", expect.anything());

            handler.emitEvents(unvoteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith("wallet.unvote", expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw if the vote is valid and the wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign vote", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureVoteTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw - multi sign vote", async () => {
            await expect(handler.throwIfCannotBeApplied(multiSignatureVoteTransaction, multiSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw if the unvote is valid and the wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign unvote", async () => {
            secondSignatureWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(secondSignatureUnvoteTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw - multi sign unvote", async () => {
            multiSignatureWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(multiSignatureUnvoteTransaction, multiSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has already voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw if vote for non delegate wallet", async () => {
            delegateWallet.forgetAttribute("delegate");
            walletRepository.index(delegateWallet);
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                VotedForNonDelegateError,
            );
        });

        it("should throw if the asset public key differs from the currently voted one", async () => {
            senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                UnvoteMismatchError,
            );
        });

        it("should throw if unvoting a non-voted wallet", async () => {
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                NoVoteError,
            );
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should not if wallet has insufficient funds for unvote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(voteTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(voteTransaction);

            await expect(handler.throwIfCannotEnterPool(voteTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", async () => {
                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.apply(voteTransaction, walletRepository);
                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });

            it("should not be ok", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await expect(handler.apply(voteTransaction, walletRepository)).rejects.toThrow(AlreadyVotedError);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.apply(unvoteTransaction, walletRepository);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.revert(voteTransaction, walletRepository);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", async () => {
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.revert(unvoteTransaction, walletRepository);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBe(
                    delegateWallet.publicKey,
                );
            });
        });
    });
});
