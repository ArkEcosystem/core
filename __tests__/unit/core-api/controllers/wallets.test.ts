import "jest-extended";

import Hapi from "@hapi/hapi";

import { Application, Container, Contracts } from "@packages/core-kernel";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { WalletsController } from "@packages/core-api/src/controllers/wallets";
import { BlockRepositoryMocks, StateStoreMocks, TransactionRepositoryMocks } from "./mocks";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Crypto, Enums, Identities, Interfaces, Transactions, Utils } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Wallets } from "@packages/core-state";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { htlcSecretHashHex } from "../../core-transactions/handlers/__fixtures__/htlc-secrets";


let app: Application;
let controller: WalletsController;
let walletRepository: Wallets.WalletRepository;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const { EpochTimestamp } = Enums.HtlcLockExpirationType;

const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height! + heightRelativeToLastBlock;
const makeNotExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

beforeEach(() => {
    app = initApp();

    app
        .unbind(Container.Identifiers.StateStore);
    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue(StateStoreMocks.stateStore);

    app
        .unbind(Container.Identifiers.BlockRepository);
    app
        .bind(Container.Identifiers.BlockRepository)
        .toConstantValue(BlockRepositoryMocks.blockRepository);

    app
        .unbind(Container.Identifiers.TransactionRepository);
    app
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue(TransactionRepositoryMocks.transactionRepository);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<WalletsController>(WalletsController);
    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    StateStoreMocks.setMockBlock({ data: mockLastBlockData } as Interfaces.IBlock);
    TransactionRepositoryMocks.setMockTransactions([]);
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

        transferTransaction = BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .sign(passphrases[0])
            .nonce("1")
            .build();
    });

    describe("index", () => {
        it("should return list of wallets", async () => {
            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.index(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }
            ));
        });
    });

    describe("top", () => {
        it("should return list of top wallets", async () => {
            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.top(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }
            ));
        });
    });

    describe("show", () => {
        it("should return lock", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                },
                query: {
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }
            ));
        });
    });

    describe("transactions", () => {
        it("should return list of transactions", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.transactions(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if wallet does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key"
                }
            };

            await expect(controller.transactions(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("transactionsSent", () => {
        it("should return list of transactions", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.transactionsSent(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if wallet does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key"
                }
            };

            await expect(controller.transactionsSent(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("transactionsReceived", () => {
        it("should return list of transactions", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.transactionsReceived(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if wallet does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key"
                }
            };

            await expect(controller.transactionsReceived(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("votes", () => {
        it("should return list of transactions", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.votes(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if wallet does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key"
                }
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

            let htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
                .amount("1")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            senderWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make("1"));

            senderWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    timestamp: mockLastBlockData.timestamp,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.index(senderWallet);

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.locks(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    lockId: htlcLockTransaction.id
                }
            ));
        });

        it("should return empty rows if cold wallet", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.address
                }
            };

            delete senderWallet.publicKey;

            let response = <PaginatedResponse>(await controller.locks(request, undefined));

            expect(response.totalCount).toBe(0);
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results.length).toBe(0);
        });

        it("should return error if wallet does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "unknown_wallet_public_key"
                }
            };

            await expect(controller.locks(request, undefined)).resolves.toThrowError("Wallet not found");
        });
    });

    describe("search", () => {
        it("should return found wallets", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                },
                query: {
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    address: senderWallet.address,
                    publicKey: senderWallet.publicKey,
                }
            ));
        });
    });
});
