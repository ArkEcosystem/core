import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Container } from "@packages/core-kernel";
import { initApp, ItemResponse } from "../__support__";
import { RoundsController } from "@packages/core-api/src/controllers/rounds";
import { BlockRepositoryMocks, RoundRepositoryMocks, StateStoreMocks, TransactionRepositoryMocks } from "./mocks";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Identities, Transactions, Utils } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let app: Application;
let controller: RoundsController;

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

    app
        .unbind(Container.Identifiers.RoundRepository);
    app
        .bind(Container.Identifiers.RoundRepository)
        .toConstantValue(RoundRepositoryMocks.roundRepository);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<RoundsController>(RoundsController);

    RoundRepositoryMocks.setRounds([]);
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

            RoundRepositoryMocks.setRounds([round]);

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
