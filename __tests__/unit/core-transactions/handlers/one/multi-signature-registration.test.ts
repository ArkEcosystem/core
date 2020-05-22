import "jest-extended";

import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../../packages/core-crypto/src";
import { Application, Contracts, Services } from "../../../../../packages/core-kernel";
import { Identifiers } from "../../../../../packages/core-kernel/src/ioc";
import { Wallets } from "../../../../../packages/core-state";
import { StateStore } from "../../../../../packages/core-state/src/stores/state";
import { Generators } from "../../../../../packages/core-test-framework/src";
import { Mapper, Mocks } from "../../../../../packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "../../../../../packages/core-test-framework/src/factories";
import passphrases from "../../../../../packages/core-test-framework/src/internal/passphrases.json";
import { getWalletAttributeSet } from "../../../../../packages/core-test-framework/src/internal/wallet-attributes";
import {
    LegacyMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
} from "../../../../../packages/core-transactions/src/errors";
import { TransactionHandler } from "../../../../../packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "../../../../../packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "../../../../../packages/crypto";
import { IMultiSignatureAsset } from "../../../../../packages/crypto/src/interfaces";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

let crypto: CryptoSuite.CryptoSuite;
beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
        exceptions: { transactions: ["37b5f11e763bdfce6816bcdc36ed7d7ad7bc3b2a16b1bbd3e7c355fceed3c22a"] },
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder, crypto.CryptoManager);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder, crypto.CryptoManager);
    multiSignatureWallet = buildMultiSignatureWallet(crypto.CryptoManager);
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(multiSignatureWallet);
    walletRepository.index(recipientWallet);
});

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
});

describe("MultiSignatureRegistrationTransaction", () => {
    let multiSignatureTransaction: Interfaces.ITransaction;
    let multiSignatureTransactionException: Interfaces.ITransaction;
    let recipientWallet: Wallets.Wallet;
    let handler: TransactionHandler;
    let multiSignatureAsset: IMultiSignatureAsset;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.MultiSignature,
                Enums.TransactionTypeGroup.Core,
            ),
            1,
        );

        senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(100390000000);

        multiSignatureAsset = {
            publicKeys: [
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
            ],
            min: 2,
        };

        recipientWallet = new Wallets.Wallet(
            crypto.CryptoManager,
            crypto.CryptoManager.Identities.Address.fromMultiSignatureAsset(multiSignatureAsset),
            new Services.Attributes.AttributeMap(getWalletAttributeSet()),
        );

        walletRepository.index(recipientWallet);

        multiSignatureTransaction = crypto.TransactionManager.BuilderFactory.multiSignature()
            .version(1)
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[0])
            .build();

        multiSignatureTransactionException = crypto.TransactionManager.BuilderFactory.multiSignature()
            .version(1)
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[3]))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[0])
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(multiSignatureTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should throw when wallet has multi signature", async () => {
            senderWallet.setAttribute("multiSignature", multiSignatureAsset);
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(multiSignatureTransaction)]);
            await expect(handler.bootstrap()).rejects.toThrow(MultiSignatureAlreadyRegisteredError);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(LegacyMultiSignatureError);
        });

        it("should not throw defined as exception", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransactionException, senderWallet, walletRepository),
            ).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should throw", async () => {
            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });
});
