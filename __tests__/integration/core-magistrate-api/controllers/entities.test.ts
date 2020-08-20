import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHttpClient } from "@arkecosystem/core-test-framework";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => await tearDown());

beforeAll(() => {
    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    expect(walletRepository).toBeTruthy();
});

describe("/entities", () => {
    it("should return entities sorted by name:asc", async () => {
        const client = app.resolve(ApiHttpClient);
        const response = await client.get("/entities");

        expect(response).toMatchObject({ status: 200 });
    });
});
