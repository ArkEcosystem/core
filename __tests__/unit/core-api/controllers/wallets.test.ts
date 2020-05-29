import "jest-extended";

import Hapi from "@hapi/hapi";
import { WalletsController } from "@packages/core-api/src/controllers/wallets";
import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Wallets } from "@packages/core-state";
import { Mocks } from "@packages/core-test-framework/src";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces } from "@packages/crypto";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { htlcSecretHashHex } from "../../core-transactions/handlers/__fixtures__/htlc-secrets";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let app: Application;
let controller: WalletsController;
let walletRepository: Wallets.WalletRepository;

const { EpochTimestamp } = Enums.HtlcLockExpirationType;
let mockLastBlockData;

let makeBlockHeightTimestamp;
let makeNotExpiredTimestamp;

const transactionHistoryService = {
    listByCriteria: jest.fn(),
};

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) => mockLastBlockData.height! + heightRelativeToLastBlock;
    makeNotExpiredTimestamp = (type) =>
        type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

    controller = app.resolve<WalletsController>(WalletsController);
    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    Mocks.StateStore.setBlock({ data: mockLastBlockData } as BlockInterfaces.IBlock);
    transactionHistoryService.listByCriteria.mockReset();
});

afterEach(() => {
    try {
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("WalletsController", () => {
    let senderWallet: Contracts.State.Wallet;
    let transferTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        senderWallet = buildSenderWallet(app, crypto);

        walletRepository.index(senderWallet);

        crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;

        transferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .sign(passphrases[0])
            .nonce("1")
            .build();
    });

    describe("index", () => {
        it("should return list of wallets", async () => {
            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }),
            );
        });
    });

    describe("top", () => {
        it("should return list of top wallets", async () => {
            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.top(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }),
            );
        });
    });

    describe("show", () => {
        it("should return lock", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }),
            );
        });
    });

    describe("transactions", () => {
        it("should return list of transactions", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [transferTransaction.data],
                count: 1,
                countIsEstimate: false,
            });

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.transactions(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should still return list of transactions when wallet is cold wallet", async () => {
            walletRepository.findByAddress("01234567890123456789");
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });

            const request: Hapi.Request = { params: { id: "01234567890123456789" }, query: {} };
            const response = (await controller.transactions(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toEqual(0);
        });

        it("should return error if wallet does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.transactions(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("transactionsSent", () => {
        it("should return list of transactions", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [transferTransaction.data],
                count: 1,
                countIsEstimate: false,
            });

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.transactionsSent(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return empty list of transactions when wallet is cold wallet", async () => {
            walletRepository.findByAddress("01234567890123456789");

            const request: Hapi.Request = { params: { id: "01234567890123456789" }, query: {} };
            const response = (await controller.transactionsSent(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toEqual(0);
        });

        it("should return error if wallet does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.transactionsSent(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("transactionsReceived", () => {
        it("should return list of transactions", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [transferTransaction.data],
                count: 1,
                countIsEstimate: false,
            });

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.transactionsReceived(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return error if wallet does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.transactionsReceived(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("votes", () => {
        it("should return list of transactions", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [transferTransaction.data],
                count: 1,
                countIsEstimate: false,
            });

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.votes(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return empty list of transactions when wallet is cold wallet", async () => {
            walletRepository.findByAddress("01234567890123456789");

            const request: Hapi.Request = { params: { id: "01234567890123456789" }, query: {} };
            const response = (await controller.votes(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toEqual(0);
        });

        it("should return error if wallet does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.votes(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("locks", () => {
        it("should return list of transactions", async () => {
            const expiration = {
                type: EpochTimestamp,
                value: makeNotExpiredTimestamp(EpochTimestamp),
            };

            const htlcLockTransaction = crypto.TransactionManager.BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrases[1]))
                .amount("1")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            senderWallet.setAttribute(
                "htlc.lockedBalance",
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1"),
            );

            senderWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    timestamp: mockLastBlockData.timestamp,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.index(senderWallet);

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.locks(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    lockId: htlcLockTransaction.id,
                }),
            );
        });

        it("should return empty rows if cold wallet", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.address,
                },
            };

            delete senderWallet.publicKey;

            const response = (await controller.locks(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBe(0);
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results.length).toBe(0);
        });

        it("should return error if wallet does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.locks(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("search", () => {
        it("should return found wallets", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.search(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }),
            );
        });
    });
});
