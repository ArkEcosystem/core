import "jest-extended";

import { Application } from "@packages/core-kernel";
import { initApp } from "../__support__";
import { Controller } from "@packages/core-api/src/controllers/controller";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";

class TestController extends Controller {
    public runRespondWithResource (data: any, transformer: any): any {
        return this.respondWithResource(data, transformer)
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
});
