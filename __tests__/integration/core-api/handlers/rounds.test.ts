import "@packages/core-test-framework/src/matchers";

import { Contracts, Container } from "@arkecosystem/core-kernel";
import { ApiHelpers, Factories } from "@packages/core-test-framework/src";

import { calculateRanks, setUp, tearDown } from "../__support__/setup";
import { DatabaseService } from "@arkecosystem/core-database";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;
beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
    await databaseService.buildWallets();
    await databaseService.saveRound(Factories.factory("Round").make());
    await (databaseService as any).initializeActiveDelegates(1);

    await calculateRanks();
});

afterAll(async () => await tearDown());

describe("API 2.0 - Rounds", () => {
    describe("GET /rounds/:id/delegates", () => {
        it("should GET the delegates of a round by the given identifier", async () => {
            const response = await api.request("GET", `rounds/1/delegates`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            expect(
                response.data.data.sort((a, b) => {
                    return a.balance > b.balance || a.publicKey < b.publicKey;
                }),
            ).toEqual(response.data.data);
        });
    });
});
