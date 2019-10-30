import "@packages/core-test-framework/src/matchers";

import { calculateRanks, setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

import { generateRound } from "../__support__/utils/generate-round";
import { delegates } from "@packages/core-test-framework/src/utils/fixtures";

import { app, Contracts, Container } from "@arkecosystem/core-kernel";

beforeAll(async () => {
    await setUp();

    const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);
    await databaseService.buildWallets();
    await databaseService.saveRound(generateRound(delegates.map(delegate => delegate.publicKey), 1));
    await (databaseService as any).initializeActiveDelegates(1);

    await calculateRanks();
});

afterAll(tearDown);

describe("API 2.0 - Rounds", () => {
    describe("GET /rounds/:id/delegates", () => {
        it("should GET the delegates of a round by the given identifier", async () => {
            const response = await utils.request("GET", `rounds/1/delegates`);

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
