import "jest-extended";

import Hapi from "@hapi/hapi";

import { Application, Container } from "@packages/core-kernel";
import { initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { VotesController } from "@arkecosystem/core-api/src/controllers/votes";
import { BlockRepositoryMocks, StateStoreMocks, TransactionRepositoryMocks } from "./mocks";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";

let app: Application;
let controller: VotesController;

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

    controller = app.resolve<VotesController>(VotesController);
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

describe("VotesController", () => {
    let voteTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        voteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + Identities.PublicKey.fromPassphrase(passphrases[1])])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        TransactionRepositoryMocks.setMockTransaction(null);
    });

    describe("index", () => {
        it("should return list of votes", async () => {
            TransactionRepositoryMocks.setMockTransactions([voteTransaction]);

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
                    id: voteTransaction.id
                }
            ));
        });
    });

    describe("show", () => {
        it("should return vote", async () => {
            TransactionRepositoryMocks.setMockTransaction(voteTransaction);

            let request: Hapi.Request = {
                params: {
                    id: voteTransaction.id,
                },
                query: {
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    id: voteTransaction.id,
                }
            ));
        });

        it("should return error if vote transaction does not exists", async () => {
            TransactionRepositoryMocks.setMockTransaction(null);

            let request: Hapi.Request = {
                params: {
                    id: "unknown_transaction_id"
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Vote not found");
        });
    });
});
