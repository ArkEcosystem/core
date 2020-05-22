import "jest-extended";

import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto/src";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { InsufficientBalanceError, IpfsHashAlreadyExists } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "@packages/crypto";

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

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;

const mockGetLastBlock = jest.fn();

let crypto: CryptoSuite.CryptoSuite;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
        exceptions: {
            transactions: ["9fbb5985e9c1f6fc9958fbf72aae5aa33e796d175ed9575c8cbe92186d443ad7"],
        },
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    factoryBuilder = new FactoryBuilder(crypto as any);
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

describe("Ipfs", () => {
    let ipfsTransaction: Interfaces.ITransaction;
    let ipfsTransactionException: Interfaces.ITransaction;
    let secondSignatureIpfsTransaction: Interfaces.ITransaction;
    let multiSignatureIpfsTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(Enums.TransactionType.Ipfs, Enums.TransactionTypeGroup.Core),
            2,
        );

        ipfsTransaction = crypto.TransactionManager.BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        ipfsTransactionException = crypto.TransactionManager.BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign("other")
            .build();

        secondSignatureIpfsTransaction = crypto.TransactionManager.BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureIpfsTransaction = crypto.TransactionManager.BuilderFactory.ipfs()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(ipfsTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw defined as exception", async () => {
            // @ts-ignore
            crypto.CryptoManager.LibraryManager.Utils.whitelistedBlockAndTransactionIds[
                ipfsTransactionException.id
            ] = true;
            await expect(
                handler.throwIfCannotBeApplied(ipfsTransactionException, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureIpfsTransaction, secondSignatureWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureIpfsTransaction, multiSignatureWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            await expect(
                handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if hash already exists", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
            await expect(handler.apply(ipfsTransaction, walletRepository)).toResolve();
            await expect(
                handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(IpfsHashAlreadyExists);
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(ipfsTransaction, walletRepository);

            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();
            expect(senderWallet.balance).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(ipfsTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();

            await handler.revert(ipfsTransaction, walletRepository);

            expect(senderWallet.hasAttribute("ipfs")).toBeFalse();
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});
