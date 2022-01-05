import "jest-extended";

import { Application, Contracts, Exceptions } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool";
import { InsufficientBalanceError, IpfsHashAlreadyExists } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { configManager } from "@packages/crypto/dist/managers";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

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

describe("Ipfs", () => {
    let ipfsTransaction: Interfaces.ITransaction;
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
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield ipfsTransaction.data;
            });

            expect(senderWallet.hasAttribute("ipfs.hashes")).toBeFalse();
            expect(
                walletRepository
                    .getIndex(Contracts.State.WalletIndexes.Ipfs)
                    .has("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w"),
            ).toBeFalse();

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Ipfs,
            });

            expect(
                walletRepository
                    .getIndex(Contracts.State.WalletIndexes.Ipfs)
                    .has("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w"),
            ).toBeTrue();

            expect(senderWallet.hasAttribute("ipfs.hashes")).toBeTrue();
            const ipfsHashes = senderWallet.getAttribute("ipfs.hashes");
            expect(ipfsHashes[ipfsTransaction.data.asset!.ipfs]).toBeTrue();
        });

        it("should resolve if wallet has ipfs attribute", async () => {
            senderWallet.setAttribute("ipfs", { hashes: {} });

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield ipfsTransaction.data;
            });

            expect(
                walletRepository
                    .getIndex(Contracts.State.WalletIndexes.Ipfs)
                    .has("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w"),
            ).toBeFalse();

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Ipfs,
            });

            expect(
                walletRepository
                    .getIndex(Contracts.State.WalletIndexes.Ipfs)
                    .has("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w"),
            ).toBeTrue();

            expect(senderWallet.hasAttribute("ipfs.hashes")).toBeTrue();
            const ipfsHashes = senderWallet.getAttribute("ipfs.hashes");
            expect(ipfsHashes[ipfsTransaction.data.asset!.ipfs]).toBeTrue();
        });

        it("should throw if asset is undefiend", async () => {
            senderWallet.setAttribute("ipfs", { hashes: {} });

            ipfsTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield ipfsTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("isActivated", () => {
        it("should return true when aip11 === true", async () => {
            await expect(handler.isActivated()).resolves.toBeTrue();

            Managers.configManager.getMilestone().aip11 = false;

            await expect(handler.isActivated()).resolves.toBeFalse();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(ipfsTransaction)).toResolve();
        });

        it("should reject if asset is not defined", async () => {
            delete ipfsTransaction.data.asset;

            await expect(handler.throwIfCannotEnterPool(ipfsTransaction)).rejects.toBeInstanceOf(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should reject when transaction with same ipfs address is already in the pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(ipfsTransaction);

            await expect(handler.throwIfCannotEnterPool(ipfsTransaction)).rejects.toBeInstanceOf(
                Contracts.TransactionPool.PoolError,
            );
        });
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
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureIpfsTransaction, secondSignatureWallet),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureIpfsTransaction, multiSignatureWallet),
            ).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if asset is undefined", async () => {
            ipfsTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if hash already exists", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();
            await expect(handler.apply(ipfsTransaction)).toResolve();
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).rejects.toThrow(
                IpfsHashAlreadyExists,
            );
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [ipfsTransaction.id]);

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();

            const balanceBefore = senderWallet.getBalance();

            await handler.apply(ipfsTransaction);

            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();
            expect(senderWallet.getBalance()).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
        });

        it("should apply ipfs transaction if wallet have ipfs attribute", async () => {
            senderWallet.setAttribute("ipfs", { hashes: {} });

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();

            const balanceBefore = senderWallet.getBalance();

            await handler.apply(ipfsTransaction);

            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();
            expect(senderWallet.getBalance()).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
        });
    });

    describe("applyToSender", () => {
        it("should throw if asset is undefined", async () => {
            ipfsTransaction.data.asset = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(ipfsTransaction)).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("revertForSender", () => {
        it("should throw if asset is undefined", async () => {
            senderWallet.setNonce(Utils.BigNumber.make("1"));

            ipfsTransaction.data.asset = undefined;

            await expect(handler.revertForSender(ipfsTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();

            const balanceBefore = senderWallet.getBalance();

            await handler.apply(ipfsTransaction);

            expect(senderWallet.getBalance()).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();

            await handler.revert(ipfsTransaction);

            expect(senderWallet.hasAttribute("ipfs")).toBeFalse();
            expect(senderWallet.getBalance()).toEqual(balanceBefore);
        });

        it("should be ok if wallet have many ipfs attributes", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet)).toResolve();

            const balanceBefore = senderWallet.getBalance();

            await handler.apply(ipfsTransaction);

            senderWallet.getAttribute("ipfs.hashes")["dummy_ipfs_hash"] = true;

            expect(senderWallet.getBalance()).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[
                    ipfsTransaction.data.asset!.ipfs!
                ],
            ).toBeTrue();

            await handler.revert(ipfsTransaction);

            expect(senderWallet.hasAttribute("ipfs")).toBeTrue();
            expect(senderWallet.getBalance()).toEqual(balanceBefore);
        });
    });
});
