import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application } from "@packages/core-kernel";
import { initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { TransactionsController } from "@packages/core-api/src/controllers/transactions";
import {
    StateStoreMocks,
    TransactionPoolProcessorMocks,
    TransactionPoolQueryMocks,
    TransactionRepositoryMocks,
} from "../mocks";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Identities, Interfaces, Managers, Transactions } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { Generators } from "@packages/core-test-framework/src";
import { configManager } from "@packages/crypto/src/managers";
import { TransactionType } from "@packages/crypto/src/enums";

let app: Application;
let controller: TransactionsController;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<TransactionsController>(TransactionsController);

    TransactionRepositoryMocks.setMockTransaction(null);
    TransactionRepositoryMocks.setMockTransactions([]);
    TransactionPoolQueryMocks.setMockTransactions([]);
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
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

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
                    id: transferTransaction.id
                }
            ));
        });
    });

    describe("store", () => {
        it("should return processor state", async () => {
            let processorState = {
                accept: [transferTransaction.id],
                broadcast: [],
                excess: [],
                invalid: []
            };

            TransactionPoolProcessorMocks.setProcessorState(processorState);

            let request: Hapi.Request = {
                payload: {
                    transactions: [
                        transferTransaction
                    ]
                }
            };

            let response = <ItemResponse>(await controller.store(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                processorState
            ));
        });
    });

    describe("show", () => {
        it("should return transaction", async () => {
            TransactionRepositoryMocks.setMockTransaction(transferTransaction);

            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id
                },
                query: {
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if transaction does not exist", async () => {
            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id
                },
                query: {
                    transform: false
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Transaction not found");
        });
    });

    describe("unconfirmed", () => {
        it("should return transactions", async () => {
            TransactionPoolQueryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.unconfirmed(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });
    });

    describe("showUnconfirmed", () => {
        it("should return transactions", async () => {
            TransactionPoolQueryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.showUnconfirmed(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id
                }
            ));
        });

        it("should return error if transaction does not exist", async () => {
            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id,
                },
                query: {
                    transform: false
                }
            };

            await expect(controller.showUnconfirmed(request, undefined)).resolves.toThrowError("Transaction not found");
        });
    });

    describe("search", () => {
        it("should return list of transactions", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transferTransaction.id,
                }
            ));
        });

        it("should return paginated response when defined offset", async () => {
            TransactionRepositoryMocks.setMockTransactions([transferTransaction]);

            let request: Hapi.Request = {
                params: {
                    id: transferTransaction.id
                },
                query: {
                    page: 1,
                    limit: 100,
                    offset: 1,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
        });
    });

    describe("types", () => {
        it("should return registered types", async () => {
            let response = <ItemResponse>(await controller.types(undefined, undefined));

            let transactionTypeObject = {};
            for(let key of Object.keys(TransactionType)) {
                if (isNaN(Number(key))) {
                    transactionTypeObject[key] = TransactionType[key]
                }
            }

            expect(response.data['1']).toEqual(expect.objectContaining(
                transactionTypeObject
            ));
        });
    });

    describe("schemas", () => {
        it("should return registered schemas", async () => {
            let response = <ItemResponse>(await controller.schemas(undefined, undefined));

            const coreTransactionHandlersCount = 11;
            expect(Object.keys(response.data['1']).length).toBe(coreTransactionHandlersCount);
        });
    });

    describe("fees", () => {
        it("should return fees", async () => {
            StateStoreMocks.setLastHeight(1);

            let response = <ItemResponse>(await controller.fees(undefined, undefined));

            expect(response.data['1']).toEqual(expect.objectContaining({
                    transfer: '10000000',
                    secondSignature: '500000000',
                    delegateRegistration: '2500000000',
                    vote: '100000000',
                    multiSignature: '500000000',
                    ipfs: '500000000',
                    multiPayment: '10000000',
                    delegateResignation: '2500000000',
                    htlcLock: '10000000',
                    htlcClaim: '0',
                    htlcRefund: '0'
                }
            ));
        });

        it("should return error ", async () => {
            StateStoreMocks.setLastHeight(-1);

            await expect(controller.fees(undefined, undefined)).resolves.toThrowError();
        });
    });
});
