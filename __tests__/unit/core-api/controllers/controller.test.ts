import "jest-extended";

import { Controller } from "@packages/core-api/src/controllers/controller";
import { BlockResource } from "@packages/core-api/src/resources";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Transactions, Utils } from "@packages/crypto";

import { initApp } from "../__support__";

class TestController extends Controller {
    public runRespondWithResource(data: any, transformer: any): any {
        return super.respondWithResource(data, transformer);
    }

    public runToCollection(data: any, transformer: any, transform: boolean): any {
        return super.toCollection(data, transformer, transform);
    }
}

let app: Application;
let controller: TestController;

beforeEach(() => {
    app = initApp();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<TestController>(TestController);
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

describe("Controller", () => {
    describe("respondWithResource", () => {
        it("should return error if data is undefined", async () => {
            expect(controller.runRespondWithResource(undefined, undefined)).toBeInstanceOf(Error);
        });
    });

    describe("toCollection", () => {
        it("should return raw data", async () => {
            const data = [
                {
                    id: "17184958558311101492",
                    version: 2,
                    height: 2,
                    timestamp: 2,
                    reward: Utils.BigNumber.make("100"),
                    totalFee: Utils.BigNumber.make("200"),
                    totalAmount: Utils.BigNumber.make("300"),
                    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                },
            ];

            expect(controller.runToCollection(data, BlockResource, false)).toStrictEqual(data);
        });

        it("should return transformed data", async () => {
            const data = [
                {
                    id: "17184958558311101492",
                    version: 2,
                    height: 2,
                    timestamp: 2,
                    reward: Utils.BigNumber.make("100"),
                    totalFee: Utils.BigNumber.make("200"),
                    totalAmount: Utils.BigNumber.make("300"),
                    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                },
            ];

            expect(controller.runToCollection(data, BlockResource, true)[0]).toEqual(
                expect.objectContaining({
                    height: 2,
                    id: "17184958558311101492",
                    version: 2,
                }),
            );
        });
    });
});
