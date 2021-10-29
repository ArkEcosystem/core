import "jest-extended";

import Hapi from "@hapi/hapi";
import { RoundsController } from "@packages/core-api/src/controllers/rounds";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Transactions, Utils } from "@packages/crypto";

import { initApp, ItemResponse } from "../__support__";

let app: Application;
let controller: RoundsController;

beforeEach(() => {
    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<RoundsController>(RoundsController);

    Mocks.RoundRepository.setRounds([]);
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

describe("RoundsController", () => {
    describe("delegates", () => {
        it("should return list of delegates", async () => {
            const round = {
                publicKey: Identities.PublicKey.fromPassphrase(passphrases[1]),
                round: Utils.BigNumber.make("12"),
                balance: Utils.BigNumber.make("555"),
            };

            Mocks.RoundRepository.setRounds([round]);

            const request: Hapi.Request = {
                params: {
                    id: "12",
                },
            };

            const response = (await controller.delegates(request, undefined)) as ItemResponse;

            expect(response.data[0]).toEqual(
                expect.objectContaining({
                    publicKey: round.publicKey,
                }),
            );
        });

        it("should return error if round does not exist", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "12",
                },
            };

            await expect(controller.delegates(request, undefined)).resolves.toThrowError("Round not found");
        });
    });
});
