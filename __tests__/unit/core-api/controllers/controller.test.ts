import "jest-extended";

import { Controller } from "@packages/core-api/src/controllers/controller";
import { BlockResource, BlockWithTransactionsResource } from "@packages/core-api/src/resources";
import { CryptoSuite } from "@packages/core-crypto";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";

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

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<TestController>(TestController);
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

describe("Controller", () => {
    describe("respondWithResource", () => {
        it("should return error if data is undefined", async () => {
            expect(controller.runRespondWithResource(undefined, undefined)).toBeInstanceOf(Error);
        });
    });

    describe("toCollection", () => {
        it("should return raw data", async () => {
            const resources = [
                {
                    id: "17184958558311101492",
                    version: 2,
                    height: 2,
                    timestamp: 2,
                    reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
                    totalFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("200"),
                    totalAmount: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("300"),
                    generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                },
            ];

            const expected = resources.map((d) =>
                Object.assign({}, d, {
                    reward: d.reward.toFixed(),
                    totalFee: d.totalFee.toFixed(),
                    totalAmount: d.totalAmount.toFixed(),
                }),
            );

            expect(controller.runToCollection(resources, BlockResource, false)).toStrictEqual(expected);
        });

        it("should return transformed data", async () => {
            const resources = [
                {
                    data: {
                        id: "17184958558311101492",
                        version: 2,
                        height: 2,
                        timestamp: 2,
                        reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
                        totalFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("200"),
                        totalAmount: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("300"),
                        generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    },
                    transactions: [],
                },
            ];

            expect(controller.runToCollection(resources, BlockWithTransactionsResource, true)[0]).toEqual(
                expect.objectContaining({
                    height: 2,
                    id: "17184958558311101492",
                    version: 2,
                }),
            );
        });
    });
});
