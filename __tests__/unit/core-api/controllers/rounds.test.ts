import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application } from "@packages/core-kernel";
import { initApp, ItemResponse } from "../__support__";
import { RoundsController } from "@packages/core-api/src/controllers/rounds";
import { Mocks } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Identities, Transactions, Utils } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let app: Application;
let controller: RoundsController;

beforeEach(() => {
    app = initApp();

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
            let round = {
                publicKey: Identities.PublicKey.fromPassphrase(passphrases[1]),
                round: Utils.BigNumber.make("12"),
                balance: Utils.BigNumber.make("555")
            };

            Mocks.RoundRepository.setRounds([round]);

            let request: Hapi.Request = {
                params: {
                    id: "12"
                }
            };

            let response = <ItemResponse>(await controller.delegates(request, undefined));

            expect(response.data[0]).toEqual(expect.objectContaining(
                {
                    publicKey: round.publicKey
                }
            ));
        });

        it("should return error if round does not exist", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "12"
                }
            };

            await expect(controller.delegates(request, undefined)).resolves.toThrowError("Round not found")
        });
    });
});
