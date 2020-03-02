import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Contracts, Application } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils, } from "@arkecosystem/crypto";
import { DelegateEvent } from "@arkecosystem/core-kernel/src/enums";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Memory } from "@arkecosystem/core-transaction-pool/src/memory";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError,
    NotEnoughDelegatesError,
    VotedForResignedDelegateError,
    WalletAlreadyResignedError,
    WalletNotADelegateError,
} from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
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

describe("DelegateResignationTransaction", () => {
    let allDelegates: [Wallets.Wallet];
    let delegateWallet: Wallets.Wallet;
    let delegatePassphrase = "my secret passphrase";

    let delegateResignationTransaction: Interfaces.ITransaction;
    let secondSignatureDelegateResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let voteHandler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.DelegateResignation, Enums.TransactionTypeGroup.Core), 2);
        voteHandler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core), 2);

        allDelegates = Array() as [Wallets.Wallet];
        for (let i = 0; i < passphrases.length; i++) {
            let delegateWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[i],
                    nonce: 0
                })
                .make();

            delegateWallet.setAttribute("delegate", { username: "username" +  i } );

            walletRepository.index(delegateWallet);
            allDelegates.push(delegateWallet);
        }

        delegateWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: delegatePassphrase,
                nonce: 0
            })
            .make();

        delegateWallet.balance = Utils.BigNumber.make(66 * 1e8);
        delegateWallet.setAttribute("delegate", {username: "dummy"});
        walletRepository.index(delegateWallet);

        delegateResignationTransaction = BuilderFactory.delegateResignation()
            .nonce("1")
            .sign(delegatePassphrase)
            .build();

        secondSignatureDelegateResignationTransaction = BuilderFactory.delegateResignation()
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            setMockTransaction(delegateResignationTransaction);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should resolve - simulate genesis wallet", async () => {
            allDelegates[0].forgetAttribute("delegate");

            walletRepository.index(allDelegates[0]);

            setMockTransaction(delegateResignationTransaction);
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(delegateResignationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(DelegateEvent.Resigned, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw if wallet is a delegate", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        });

        it("should not throw if wallet is a delegate - second sign", async () => {
            secondSignatureWallet.setAttribute("delegate", {username: "dummy"});
            walletRepository.index(secondSignatureWallet);
            await expect(handler.throwIfCannotBeApplied(secondSignatureDelegateResignationTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw if wallet is a delegate due too many delegates", async () => {
            let anotherDelegate: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "anotherDelegate",
                    nonce: 0
                })
                .make();

            anotherDelegate.setAttribute("delegate", {username: "another"});
            walletRepository.index(anotherDelegate);

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet is not a delegate", async () => {
            delegateWallet.forgetAttribute("delegate");
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            delegateWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if not enough delegates", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
            allDelegates[0].setAttribute("delegate.resigned", true);
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                NotEnoughDelegatesError,
            );
        });

        it("should throw if not enough delegates due to already resigned delegates", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            delegateWallet.setAttribute("delegate.resigned", true);

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletAlreadyResignedError,
            );
        });

        // it("should throw if not enough delegates registered", async () => {
        //     let anotherDelegateWallet: Wallets.Wallet = factoryBuilder
        //         .get("Wallet")
        //         .withOptions({
        //             passphrase: "another delegate passphrase",
        //             nonce: 0
        //         })
        //         .make();
        //
        //     delegateWallet.setAttribute("delegate", {username: "another"});
        //
        //     await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        // });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(delegateResignationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should apply delegate resignation", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
        });

        it("should fail when already resigned", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletAlreadyResignedError,
            );
        });

        it("should fail when not a delegate", async () => {
            delegateWallet.forgetAttribute("delegate");

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should fail when voting for a resigned delegate", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            const voteTransaction = BuilderFactory.vote()
                .votesAsset(["+" + delegateWallet.publicKey])
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(voteHandler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                VotedForResignedDelegateError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
            await handler.revert(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
        });
    });
});
