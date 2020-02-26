import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Contracts, Application } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { DelegateEvent } from "@arkecosystem/core-kernel/src/enums";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { IMultiSignatureAsset } from "@arkecosystem/crypto/src/interfaces";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError,
    NotSupportedForMultiSignatureWalletError,
    WalletIsAlreadyDelegateError,
    WalletUsernameAlreadyRegisteredError,
} from "@arkecosystem/core-transactions/src/errors";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import { setMockBlock } from "../__mocks__/block-repository";

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

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(multiSignatureWallet);
    walletRepository.reindex(recipientWallet);
});

describe("DelegateRegistrationTransaction", () => {
    let delegateRegistrationTransaction: Interfaces.ITransaction;
    let secondSignaturedDelegateRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.DelegateRegistration, Enums.TransactionTypeGroup.Core), 2);

        delegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignaturedDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(delegateRegistrationTransaction);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should resolve with bocks", async () => {
            setMockTransaction(delegateRegistrationTransaction);
            setMockBlock({
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                totalRewards: "2",
                totalFees: "2",
                totalProduced: "1",
                id: "1",
                height: "1",
                timestamp: "1",
            });
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(delegateRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(DelegateEvent.Registered, expect.anything());
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignaturedDelegateRegistrationTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[21]),
                    Identities.PublicKey.fromPassphrase(passphrases[22]),
                    Identities.PublicKey.fromPassphrase(passphrases[23]),
                ]
            };

            senderWallet.setAttribute(
                "multiSignature",
                multiSignatureAsset
            );

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                NotSupportedForMultiSignatureWalletError,
            );
        });

        // it("should throw if transaction does not have delegate", async () => {
        //     delegateRegistrationTransaction.data.asset.delegate.username! = null;
        //
        //     await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
        //         WalletNotADelegateError,
        //     );
        // });

        it("should throw if wallet already registered a username", async () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                WalletIsAlreadyDelegateError,
            );
        });

        it("should throw if another wallet already registered a username", async () => {
            const delegateWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "delegate passphrase",
                    nonce: 0
                })
                .make();

            delegateWallet.setAttribute("delegate", { username: "dummy" });

            walletRepository.reindex(delegateWallet);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                WalletUsernameAlreadyRegisteredError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(delegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });

        it("should throw if transaction with same username already in pool", async () => {
            let anotherDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
                .usernameAsset("dummy")
                .nonce("1")
                .sign(passphrases[2])
                .build();

            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(anotherDelegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should set username", async () => {
            await handler.apply(delegateRegistrationTransaction, walletRepository);
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", async () => {
            expect(senderWallet.hasAttribute("delegate.username")).toBeFalse();

            await handler.apply(delegateRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("delegate.username")).toBeTrue();
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");

            await handler.revert(delegateRegistrationTransaction, walletRepository);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.hasAttribute("delegate.username")).toBeFalse();
        });
    });
});
