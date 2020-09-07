import { Application } from "@arkecosystem/core-kernel";
import { ApiHttpClient } from "@arkecosystem/core-test-framework/src/utils";

import { setUp, tearDown } from "./__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("ApiHttpClient.get", () => {
    it("should send stringified GET parameters", async () => {
        const client = app.resolve(ApiHttpClient);
        const response = await client.get("/echo", { a: "a", b: 1 });

        expect(response).toMatchObject({
            status: 200,
            body: {
                query: { a: "a", b: "1" },
            },
        });
    });
});

describe("ApiHttpClient.post", () => {
    it("should send stringified GET parameters and raw POST payload", async () => {
        const client = app.resolve(ApiHttpClient);
        const response = await client.post("/echo", { a: "a", b: 1 }, { a: "a", b: 1 });

        expect(response).toMatchObject({
            status: 200,
            body: {
                query: { a: "a", b: "1" },
                payload: { a: "a", b: 1 },
            },
        });
    });
});
