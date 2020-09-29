import { Application } from "@arkecosystem/core-kernel";
import { ApiInjectClient } from "@arkecosystem/core-test-framework";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("/delegates", () => {
    it("should return delegates sorted by rank:asc", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/delegates");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const delegates = response.body.data;
        let prevRank = delegates[0].rank;

        expect(prevRank).toBe(1);
        for (const delegate of delegates.slice(1)) {
            expect(delegate.rank - prevRank).toBe(1);
            prevRank = delegate.rank;
        }
    });

    it("should return delegates with production.approval equal 1.96", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/delegates?production.approval=1.96");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const delegates = response.body.data;

        expect(delegates.length).toBe(51);
        for (const delegate of delegates) {
            expect(delegate.production.approval).toBe(1.96);
        }
    });
});
