import "jest-extended";

import Hapi from "@hapi/hapi";
import { TransactionsController } from "@packages/core-api/src/controllers/transactions";
import { Contracts } from "@packages/core-kernel";
import { Application, Utils } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Interfaces, Managers, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { TransactionType } from "@packages/crypto/src/enums";
import { configManager } from "@packages/crypto/src/managers";

import { initApp, ItemResponse, PaginatedResponse } from "../__support__";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

let app: Application;
let controller: TransactionsController;

const transactionHistoryService = {
    findOneByCriteria: jestfn<Contracts.Shared.TransactionHistoryService["findOneByCriteria"]>(),
    listByCriteria: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteria"]>(),
    listByCriteriaJoinBlock: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteriaJoinBlock"]>(),
};

const blockHistoryService = {
    findOneByCriteria: jestfn<Contracts.Shared.BlockHistoryService["findOneByCriteria"]>(),
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
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();
    app.bind(Identifiers.BlockHistoryService).toConstantValue(blockHistoryService);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<TransactionsController>(TransactionsController);

    Mocks.TransactionRepository.setTransaction(null);
    Mocks.TransactionRepository.setTransactions([]);
    Mocks.TransactionPoolQuery.setTransactions([]);
    transactionHistoryService.findOneByCriteria.mockReset();
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

describe("TransactionsController", () => {
    let transferTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        transferTransaction = BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    describe("index", () => {
        it("should return list of transactions", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                results: [transferTransaction.data],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

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
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return list of transactions using transform", async () => {
            transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValue({
                results: [{ data: transferTransaction.data, block: block }],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: true,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });
    });

    describe("store", () => {
        it("should return processor state", async () => {
            const processorState = {
                accept: [transferTransaction.id],
                broadcast: [],
                excess: [],
                invalid: [],
            };

            Mocks.TransactionPoolProcessor.setProcessorState(processorState);

            const request: Hapi.Request = {
                payload: {
                    transactions: [transferTransaction],
                },
            };

            const response = (await controller.store(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(expect.objectContaining(processorState));
        });
    });

    describe("show", () => {
        it("should return transaction", async () => {
            transactionHistoryService.findOneByCriteria.mockResolvedValue(transferTransaction.data);

            const request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return transaction using transform", async () => {
            transactionHistoryService.findOneByCriteria.mockResolvedValue(transferTransaction.data);
            blockHistoryService.findOneByCriteria.mockResolvedValue(block);

            const request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: true,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return error if transaction does not exist", async () => {
            const request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Transaction not found");
        });
    });

    describe("unconfirmed", () => {
        it("should return transactions", async () => {
            Mocks.TransactionPoolQuery.setTransactions([transferTransaction]);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.unconfirmed(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });
    });

    describe("showUnconfirmed", () => {
        it("should return transactions", async () => {
            Mocks.TransactionPoolQuery.setTransactions([transferTransaction]);

            const request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.showUnconfirmed(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    id: transferTransaction.id,
                }),
            );
        });

        it("should return error if transaction does not exist", async () => {
            const request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false,
                },
            };

            await expect(controller.showUnconfirmed(request, undefined)).resolves.toThrowError("Transaction not found");
        });
    });

    describe("types", () => {
        it("should return registered types", async () => {
            const response = (await controller.types(undefined, undefined)) as ItemResponse;

            const transactionTypeObject = {};
            for (const key of Object.keys(TransactionType)) {
                if (isNaN(Number(key))) {
                    transactionTypeObject[key] = TransactionType[key];
                }
            }

            expect(response.data["1"]).toEqual(expect.objectContaining(transactionTypeObject));
        });
    });

    describe("schemas", () => {
        it("should return registered schemas", async () => {
            const response = (await controller.schemas(undefined, undefined)) as ItemResponse;

            const coreTransactionHandlersCount = 11;
            expect(Object.keys(response.data["1"]).length).toBe(coreTransactionHandlersCount);
        });
    });

    describe("fees", () => {
        it("should return fees", async () => {
            Mocks.StateStore.setLastHeight(1);

            const response = (await controller.fees(undefined, undefined)) as ItemResponse;

            expect(response.data["1"]).toEqual(
                expect.objectContaining({
                    transfer: "10000000",
                    secondSignature: "500000000",
                    delegateRegistration: "2500000000",
                    vote: "100000000",
                    multiSignature: "500000000",
                    ipfs: "500000000",
                    multiPayment: "10000000",
                    delegateResignation: "2500000000",
                    htlcLock: "10000000",
                    htlcClaim: "0",
                    htlcRefund: "0",
                }),
            );
        });
    });
});
