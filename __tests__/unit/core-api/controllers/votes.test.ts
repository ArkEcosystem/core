import "jest-extended";

import Hapi from "@hapi/hapi";

import { initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { VotesController } from "../../../../packages/core-api/src/controllers/votes";
import { CryptoSuite } from "../../../../packages/core-crypto";
import { Application } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { Mocks } from "../../../../packages/core-test-framework/src";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";
import { Interfaces } from "../../../../packages/crypto";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let app: Application;
let controller: VotesController;

const transactionHistoryService = {
    findOneByCriteria: jest.fn(),
    listByCriteria: jest.fn(),
};

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    controller = app.resolve<VotesController>(VotesController);
    transactionHistoryService.findOneByCriteria.mockReset();
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

describe("VotesController", () => {
    let voteTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        voteTransaction = crypto.TransactionManager.BuilderFactory.vote()
            .votesAsset(["+" + crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1])])
            .nonce("1")
            .sign(passphrases[0])
            .build();

        Mocks.TransactionRepository.setTransaction(null);
    });

    describe("index", () => {
        it("should return list of votes", async () => {
            transactionHistoryService.listByCriteria.mockResolvedValue({
                rows: [voteTransaction.data],
                count: 1,
                countIsEstimate: false,
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
                    id: voteTransaction.id,
                }),
            );
        });
    });

    describe("show", () => {
        it("should return vote", async () => {
            transactionHistoryService.findOneByCriteria.mockResolvedValue(voteTransaction.data);

            const request: Hapi.Request = {
                params: {
                    id: voteTransaction.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    id: voteTransaction.id,
                }),
            );
        });

        it("should return error if vote transaction does not exists", async () => {
            transactionHistoryService.findOneByCriteria.mockResolvedValue(undefined);

            const request: Hapi.Request = {
                params: {
                    id: "unknown_transaction_id",
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Vote not found");
        });
    });
});
