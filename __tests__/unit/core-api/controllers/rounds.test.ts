import "jest-extended";

import Hapi from "@hapi/hapi";

import { initApp, ItemResponse } from "../__support__";
import { RoundsController } from "../../../../packages/core-api/src/controllers/rounds";
import { CryptoSuite } from "../../../../packages/core-crypto";
import { Application } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { Mocks } from "../../../../packages/core-test-framework/src";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;
crypto.CryptoManager.MilestoneManager.getMilestone().htlcEnabled = true;

let app: Application;
let controller: RoundsController;

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<RoundsController>(RoundsController);

    Mocks.RoundRepository.setRounds([]);
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

describe("RoundsController", () => {
    describe("delegates", () => {
        it("should return list of delegates", async () => {
            const round = {
                publicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
                round: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("12"),
                balance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("555"),
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
