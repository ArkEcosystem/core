import "jest-extended";

import Hapi from "@hapi/hapi";
import { WalletsController } from "@packages/core-api/src/controllers/wallets";
import { Identifiers as ApiIdentifiers } from "@packages/core-api/src/identifiers";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Wallets } from "@packages/core-state";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Identities, Interfaces, Transactions, Utils } from "@packages/crypto";
import { Managers } from "@packages/crypto/src";
import { BuilderFactory } from "@packages/crypto/src/transactions";

import { buildSenderWallet, initApp, PaginatedResponse } from "../__support__";

let app: Application;
let controller: WalletsController;
let walletRepository: Wallets.WalletRepository;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const transactionHistoryService = {
    listByCriteria: jest.fn(),
    listByCriteriaJoinBlock: jest.fn(),
};

const walletSearchService = {
    getWallet: jest.fn(),
};

const block: Interfaces.IBlockData = {
    version: 0,
    timestamp: 103497376,
    height: 152,
    previousBlockHex: "23d6352eb4450dfb",
    previousBlock: "2582309911052750331",
    numberOfTransactions: 0,
    totalAmount: Utils.BigNumber.make("0"),
    totalFee: Utils.BigNumber.make("0"),
    reward: Utils.BigNumber.make("0"),
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "021770413ad01c60b94e1d3ed44c00e0145fe7897e40f5f6265e220f4e65cf427f",
    blockSignature:
        "3045022100f43e1133e74eca9fa8090c9b581fb1727d1e007818a53247ff9272b6bb64242e02201473233d08829d9ee6c35fee462a62911d675f1dc3ab66798882475b5acabb86",
    idHex: "420d4f574229b758",
    id: "4759547617391261528",
};

beforeEach(() => {
    jest.resetAllMocks();

    app = initApp();
    app.bind(ApiIdentifiers.LockSearchService).toConstantValue(null);
    app.bind(ApiIdentifiers.WalletSearchService).toConstantValue(walletSearchService);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<WalletsController>(WalletsController);
    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    Mocks.StateStore.setBlock({ data: mockLastBlockData } as Interfaces.IBlock);
    transactionHistoryService.listByCriteria.mockReset();
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("WalletsController", () => {
    let senderWallet: Contracts.State.Wallet;
    let transferTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        senderWallet = buildSenderWallet(app);

        walletRepository.index(senderWallet);

        Managers.configManager.getMilestone().aip11 = true;

        transferTransaction = BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .sign(passphrases[0])
            .nonce("1")
            .build();
    });

    describe("transactions", () => {
        it("should return list of transactions", async () => {
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

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

        it("should return list of transactions using transform", async () => {
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
                rows: [{ data: transferTransaction.data, block: block }],
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
                    transform: true,
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

        it("should return error if wallet does not exists", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

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
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
                publicKey: senderWallet.publicKey,
            });

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

        it("should return list of transactions using transform", async () => {
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
                publicKey: senderWallet.publicKey,
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
                rows: [{ data: transferTransaction.data, block: block }],
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
                    transform: true,
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
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

            const request: Hapi.Request = { params: { id: "01234567890123456789" }, query: {} };
            const response = (await controller.transactionsSent(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toEqual(0);
        });

        it("should return error if wallet does not exists", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

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
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

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

        it("should return list of transactions using transform", async () => {
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
                rows: [{ data: transferTransaction.data, block: block }],
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
                    transform: true,
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
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
                publicKey: senderWallet.publicKey,
            });

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

        it("should return list of transactions using transform", async () => {
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
                publicKey: senderWallet.publicKey,
            });

            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
                rows: [{ data: transferTransaction.data, block: block }],
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
                    transform: true,
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
            walletSearchService.getWallet.mockReturnValueOnce({
                address: Identities.Address.fromPublicKey(senderWallet.publicKey),
            });

            const request: Hapi.Request = { params: { id: "01234567890123456789" }, query: {} };
            const response = (await controller.votes(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toEqual(0);
        });

        it("should return error if wallet does not exists", async () => {
            walletSearchService.getWallet.mockReturnValueOnce(undefined);

            const request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key",
                },
            };

            await expect(controller.votes(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });
});
