import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Contracts, Application } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils, } from "@arkecosystem/crypto";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError,
    IpfsHashAlreadyExists,
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

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(multiSignatureWallet);
    walletRepository.reindex(recipientWallet);
});

describe("Ipfs", () => {
    let ipfsTransaction: Interfaces.ITransaction;
    let secondSignatureIpfsTransaction: Interfaces.ITransaction;
    let multiSignatureIpfsTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Ipfs, Enums.TransactionTypeGroup.Core), 2);

        ipfsTransaction = BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureIpfsTransaction = BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureIpfsTransaction = BuilderFactory.ipfs()
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
            setMockTransaction(ipfsTransaction);
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        let pubKeyHash: number;

        beforeEach(() => {
            pubKeyHash = configManager.get("network.pubKeyHash");
        });

        afterEach(() => {
            configManager.set("exceptions.transactions", []);
            configManager.set("network.pubKeyHash", pubKeyHash);
        });

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [ipfsTransaction.id]);

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureIpfsTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(handler.throwIfCannotBeApplied(multiSignatureIpfsTransaction, multiSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if hash already exists", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
            await expect(handler.apply(ipfsTransaction, walletRepository)).toResolve();
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).rejects.toThrow(
                IpfsHashAlreadyExists,
            );
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(ipfsTransaction, walletRepository);

            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[ipfsTransaction.data.asset!.ipfs!],
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
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[ipfsTransaction.data.asset!.ipfs!],
            ).toBeTrue();

            await handler.revert(ipfsTransaction, walletRepository);

            expect(senderWallet.hasAttribute("ipfs")).toBeFalse();
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});
