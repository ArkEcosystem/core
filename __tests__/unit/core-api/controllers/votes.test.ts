import "jest-extended";

import Hapi from "@hapi/hapi";

import { Application } from "@packages/core-kernel";
import { initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { VotesController } from "@packages/core-api/src/controllers/votes";
import { Mocks } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";

let app: Application;
let controller: VotesController;

beforeEach(() => {
    app = initApp();

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

        Mocks.TransactionRepository.setMockTransaction(null);
    });

    describe("index", () => {
        it("should return list of votes", async () => {
            Mocks.TransactionRepository.setMockTransactions([voteTransaction]);

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
            Mocks.TransactionRepository.setMockTransaction(voteTransaction);

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
            Mocks.TransactionRepository.setMockTransaction(null);

            let request: Hapi.Request = {
                params: {
                    id: "unknown_transaction_id"
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Vote not found");
        });
    });
});
